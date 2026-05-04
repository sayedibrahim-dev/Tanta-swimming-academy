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
  const { error } = await supabaseAdmin
    .from("swimmers")            // في جدول السباحين
    .update({
      coach_id, // المدرب الجديد (تم التحقق من ملكية المجموعة له)
      group_id, // المجموعة الجديدة (تم التحقق من انتمائها للمدرب)
    })
    .eq("id", id)               // للسباح المحدد بالمعرف
    .eq("status", "active");    // بشرط أن يكون نشطاً

  // التعامل مع أي خطأ من Supabase
  if (error) {
    console.error("Supabase error reassigning swimmer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعادة التعيين" },
      { status: 500 }
    );
  }

  // الرد بالنجاح
  return NextResponse.json({ success: true });
}
