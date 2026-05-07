// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد Zod للتحقق من البيانات الواردة
import { z } from "zod";

// ==========================================
// Schema التحقق من بيانات تعديل المدرب
// ==========================================
const editSchema = z.object({
  name:  z.string().min(2, "الاسم قصير جداً"),               // اسم المدرب
  phone: z.string().min(10, "رقم التليفون غير صحيح"),        // رقم الهاتف
  email: z.string().email("البريد الإلكتروني غير صحيح"),     // البريد الإلكتروني
});

// ==========================================
// Handler الـ PATCH — تعديل بيانات مدرب
// المسار: PATCH /api/admin/coaches/[id]
// ==========================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params هو Promise في Next.js 16
) {

  // التحقق من أن المستخدم أدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // استخراج معرف المدرب من الـ URL
  const { id: coachId } = await params;

  // قراءة البيانات الواردة والتحقق منها
  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  const { name, phone, email } = parsed.data;

  // جلب بيانات المدرب للحصول على user_id
  const { data: coach, error: fetchError } = await supabaseAdmin
    .from("coaches")
    .select("id, user_id")
    .eq("id", coachId)
    .single();

  // لو المدرب مش موجود — ارجع بخطأ 404
  if (fetchError || !coach) {
    return NextResponse.json({ error: "المدرب غير موجود" }, { status: 404 });
  }

  // التحقق من أن الإيميل الجديد مش مستخدم بحساب تاني
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .neq("id", coach.user_id) // استثناء الـ user الحالي للمدرب
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json(
      { error: "هذا البريد الإلكتروني مستخدم بالفعل" },
      { status: 409 }
    );
  }

  // تحديث بيانات المدرب (الاسم + التليفون) في جدول coaches
  const { error: coachUpdateError } = await supabaseAdmin
    .from("coaches")
    .update({ name, phone }) // تحديث الاسم ورقم التليفون
    .eq("id", coachId);

  if (coachUpdateError) {
    console.error("خطأ في تحديث بيانات المدرب:", coachUpdateError);
    return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 });
  }

  // تحديث الإيميل في جدول users
  const { error: userUpdateError } = await supabaseAdmin
    .from("users")
    .update({ email: email.toLowerCase() }) // تحديث الإيميل بحروف صغيرة
    .eq("id", coach.user_id);

  if (userUpdateError) {
    console.error("خطأ في تحديث إيميل المدرب:", userUpdateError);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث البريد الإلكتروني" }, { status: 500 });
  }

  // كل حاجة اتعملت بنجاح
  return NextResponse.json({ message: "تم تحديث بيانات المدرب بنجاح" });
}

// ==========================================
// Handler الـ DELETE — حذف مدرب
// المسار: DELETE /api/admin/coaches/[id]
//
// المنطق:
// 1. التحقق من الأدمن
// 2. جلب الـ user_id المرتبط بالمدرب
// 3. حذف الـ user (الـ coach بيتحذف تلقائياً بسبب ON DELETE CASCADE)
// 4. سباحي المدرب بيتحول coach_id بتاعهم لـ NULL تلقائياً (ON DELETE SET NULL)
// ==========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params هو Promise في Next.js 16
) {

  // التحقق من أن المستخدم أدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // استخراج معرف المدرب من الـ URL
  const { id: coachId } = await params; // await مطلوب لأن params هو Promise

  // ==========================================
  // جلب الـ user_id المرتبط بهذا المدرب
  // محتاجينه عشان نحذف الـ user (وبالتبعية الـ coach)
  // ==========================================
  const { data: coach, error: fetchError } = await supabaseAdmin
    .from("coaches")         // من جدول المدربين
    .select("id, user_id")   // بنحتاج الـ id والـ user_id فقط
    .eq("id", coachId)       // فلترة على معرف المدرب
    .single();               // بنتوقع سجل واحد

  // لو المدرب مش موجود — ارجع بخطأ 404
  if (fetchError || !coach) {
    return NextResponse.json({ error: "المدرب غير موجود" }, { status: 404 });
  }

  // ==========================================
  // حذف الـ user المرتبط بالمدرب
  //
  // ليه بنحذف الـ user وماحذفناش الـ coach مباشرة؟
  // لأن في الـ schema: coaches.user_id REFERENCES users(id) ON DELETE CASCADE
  // يعني لما نحذف الـ user، الـ coach بيتحذف أوتوماتيك
  //
  // وسباحي المدرب؟
  // swimmers.coach_id REFERENCES coaches(id) ON DELETE SET NULL
  // يعني لما الـ coach يتحذف، سباحيه coach_id بيبقى NULL (مش بيتحذفوا)
  // ==========================================
  const { error: deleteError } = await supabaseAdmin
    .from("users")             // من جدول المستخدمين
    .delete()                  // حذف
    .eq("id", coach.user_id);  // حذف الـ user المرتبط بالمدرب

  // لو فشل الحذف — ارجع بخطأ 500
  if (deleteError) {
    console.error("خطأ في حذف المدرب:", deleteError);
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }

  // كل حاجة اتعملت بنجاح
  return NextResponse.json({ message: "تم حذف المدرب بنجاح" });
}
