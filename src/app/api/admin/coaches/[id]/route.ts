// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

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
