import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  newEmail:        z.string().email("البريد الإلكتروني غير صحيح"),
  currentPassword: z.string().min(1, "كلمة المرور مطلوبة للتأكيد"),
});

// ==========================================
// PATCH /api/admin/settings/email
// تغيير البريد الإلكتروني للأدمن بعد التحقق من كلمة المرور
// ==========================================
export async function PATCH(req: NextRequest) {

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  const { newEmail, currentPassword } = parsed.data;

  // جلب بيانات الأدمن الحالي
  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id, email, password_hash")
    .eq("id", session.user.id)
    .maybeSingle();

  if (fetchError || !user) {
    return NextResponse.json({ error: "لم يتم العثور على المستخدم" }, { status: 404 });
  }

  // التحقق من كلمة المرور قبل تغيير البريد
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    return NextResponse.json(
      { error: "كلمة المرور غير صحيحة" },
      { status: 400 }
    );
  }

  // التحقق أن البريد الجديد مختلف عن الحالي
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "البريد الجديد مطابق للبريد الحالي" },
      { status: 400 }
    );
  }

  // التحقق من عدم وجود بريد مكرر
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", newEmail.toLowerCase())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "هذا البريد الإلكتروني مستخدم بالفعل" },
      { status: 409 }
    );
  }

  // تحديث البريد
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ email: newEmail.toLowerCase() })
    .eq("id", user.id);

  if (updateError) {
    console.error("خطأ في تحديث البريد:", updateError);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث البريد الإلكتروني" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "تم تغيير البريد الإلكتروني بنجاح" });
}
