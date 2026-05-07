import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ==========================================
// Schema للتحقق من البيانات الواردة
// ==========================================
const schema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور الجديدة 8 أحرف على الأقل"),
});

// ==========================================
// PATCH /api/admin/settings/password
// تغيير كلمة مرور الأدمن
// ==========================================
export async function PATCH(req: NextRequest) {

  // التحقق من صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // قراءة البيانات والتحقق منها
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // جلب كلمة المرور الحالية المخزنة (hash)
  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id, password_hash")
    .eq("id", session.user.id)
    .maybeSingle();

  if (fetchError || !user) {
    return NextResponse.json({ error: "لم يتم العثور على المستخدم" }, { status: 404 });
  }

  // التحقق من صحة كلمة المرور الحالية
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    return NextResponse.json(
      { error: "كلمة المرور الحالية غير صحيحة" },
      { status: 400 }
    );
  }

  // التحقق أن كلمة المرور الجديدة مختلفة
  const isSame = await bcrypt.compare(newPassword, user.password_hash);
  if (isSame) {
    return NextResponse.json(
      { error: "كلمة المرور الجديدة مطابقة للقديمة" },
      { status: 400 }
    );
  }

  // تشفير كلمة المرور الجديدة (cost factor 12)
  const newHash = await bcrypt.hash(newPassword, 12);

  // تحديث كلمة المرور في قاعدة البيانات
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", user.id);

  if (updateError) {
    console.error("خطأ في تحديث كلمة المرور:", updateError);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث كلمة المرور" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" });
}
