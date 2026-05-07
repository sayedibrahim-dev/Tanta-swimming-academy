// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد bcrypt لتشفير كلمة المرور الجديدة
import bcrypt from "bcryptjs";

// استيراد Zod للتحقق من البيانات الواردة
import { z } from "zod";

// ==========================================
// Schema التحقق من البيانات الواردة
// ==========================================
const schema = z.object({
  newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"), // كلمة المرور الجديدة
});

// ==========================================
// PATCH /api/admin/parents/[id]/reset-password
// الأدمن يعيد تعيين كلمة مرور ولي الأمر
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

  // استخراج معرف ولي الأمر من الـ URL
  const { id: parentId } = await params;

  // قراءة البيانات الواردة والتحقق منها
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  const { newPassword } = parsed.data;

  // جلب بيانات ولي الأمر للحصول على user_id
  const { data: parent, error: fetchError } = await supabaseAdmin
    .from("parents")
    .select("id, user_id")
    .eq("id", parentId)
    .single();

  // لو ولي الأمر مش موجود — ارجع بخطأ 404
  if (fetchError || !parent) {
    return NextResponse.json({ error: "ولي الأمر غير موجود" }, { status: 404 });
  }

  // تشفير كلمة المرور الجديدة بـ bcrypt (cost factor 12)
  const newHash = await bcrypt.hash(newPassword, 12);

  // تحديث كلمة المرور في جدول users
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ password_hash: newHash }) // حفظ الـ hash الجديد
    .eq("id", parent.user_id);

  // لو فشل التحديث — ارجع بخطأ 500
  if (updateError) {
    console.error("خطأ في إعادة تعيين كلمة المرور:", updateError);
    return NextResponse.json({ error: "حدث خطأ أثناء إعادة التعيين" }, { status: 500 });
  }

  // كل حاجة اتعملت بنجاح
  return NextResponse.json({ message: "تم إعادة تعيين كلمة المرور بنجاح" });
}
