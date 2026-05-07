// استيراد دالة جلب الجلسة للتحقق من صلاحية الأدمن
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد NextResponse لإرجاع ردود HTTP
import { NextResponse } from "next/server";

// استيراد Zod للتحقق من صحة البيانات
import { z } from "zod";

// ==========================================
// Schema للتحقق من البيانات الواردة
// نتحقق إن coach_id و group_id هما UUID صحيحان
// ==========================================
const reassignSchema = z.object({
  coach_id: z.string().uuid("معرف المدرب غير صحيح"),   // لازم يكون UUID
  group_id: z.string().uuid("معرف المجموعة غير صحيح"), // لازم يكون UUID
});

// ==========================================
// PATCH /api/admin/swimmers/[id]
// يعيّن مدرباً ومجموعة جديدة للسباح
// مع التحقق من أن المجموعة تابعة للمدرب المختار
// ==========================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params هنا Promise في Next.js 16
) {
  // التحقق من صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // انتظار الـ params لأنها Promise في Next.js 16
  const { id } = await params;

  // قراءة البيانات الجديدة من جسم الطلب
  const body = await req.json();

  // التحقق من صحة البيانات باستخدام Zod (UUID validation)
  const parsed = reassignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  const { coach_id, group_id } = parsed.data;

  // ==========================================
  // التحقق من أن المجموعة تابعة للمدرب المختار
  // هذا يمنع تعيين مجموعة لمدرب لا يملكها (تناسق البيانات)
  // ==========================================
  const { data: group, error: groupError } = await supabaseAdmin
    .from("training_groups")   // من جدول المجموعات
    .select("id, coach_id")    // نحتاج الـ id والمدرب للتحقق
    .eq("id", group_id)        // فلترة على معرف المجموعة
    .single();

  // لو المجموعة مش موجودة أو مش تابعة للمدرب المختار
  if (groupError || !group || group.coach_id !== coach_id) {
    return NextResponse.json(
      { error: "المجموعة لا تتبع هذا المدرب" },
      { status: 400 }
    );
  }

  // تحديث بيانات السباح في قاعدة البيانات
  // .select("id") عشان نتحقق إن row اتحدثت فعلاً (مش 0 rows)
  const { data: updated, error } = await supabaseAdmin
    .from("swimmers")
    .update({
      coach_id, // المدرب الجديد (تم التحقق من ملكية المجموعة له)
      group_id, // المجموعة الجديدة (تم التحقق من انتمائها للمدرب)
    })
    .eq("id", id)
    .eq("status", "active")     // بشرط أن يكون نشطاً
    .select("id");              // نرجع الـ id عشان نعرف لو اتحدث

  // التعامل مع أي خطأ من Supabase
  if (error) {
    console.error("Supabase error reassigning swimmer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعادة التعيين" },
      { status: 500 }
    );
  }

  // لو مفيش rows اتحدثت — السباح مش موجود أو مش نشط
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "السباح غير موجود أو غير نشط" },
      { status: 404 }
    );
  }

  // الرد بالنجاح
  return NextResponse.json({ success: true });
}

// ==========================================
// DELETE /api/admin/swimmers/[id]
// حذف سباح نهائياً من النظام
// ==========================================
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // التحقق من صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  // التحقق من وجود السباح أولاً
  const { data: swimmer, error: fetchError } = await supabaseAdmin
    .from("swimmers")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !swimmer) {
    return NextResponse.json({ error: "السباح غير موجود" }, { status: 404 });
  }

  // حذف السباح — الـ payments والـ enrollment_requests بتتحذف تلقائياً (CASCADE)
  const { error: deleteError } = await supabaseAdmin
    .from("swimmers")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("خطأ في حذف السباح:", deleteError);
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }

  return NextResponse.json({ message: "تم حذف السباح بنجاح" });
}
