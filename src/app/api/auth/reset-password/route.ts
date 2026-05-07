import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";

// التحقق من البيانات الواردة
const schema = z.object({
  token:       z.string().min(1, "التوكن مطلوب"),
  newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

// ==========================================
// POST /api/auth/reset-password
// ولي الأمر يرسل التوكن + كلمة المرور الجديدة
// السيرفر يتحقق من التوكن ويحدث كلمة المرور
// الأدمن لا علاقة له بهذه العملية
// ==========================================
export async function POST(req: NextRequest) {

  const body   = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  const { token, newPassword } = parsed.data;

  // ==========================================
  // التحقق من وجود التوكن وصلاحيته
  // ==========================================
  const { data: record, error: fetchError } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  // التوكن مش موجود أصلاً
  if (fetchError || !record) {
    return NextResponse.json(
      { error: "الرابط غير صالح أو تم استخدامه من قبل" },
      { status: 400 }
    );
  }

  // التوكن انتهت صلاحيته
  if (new Date(record.expires_at) < new Date()) {
    // نحذفه من DB عشان نظافة
    await supabaseAdmin
      .from("password_reset_tokens")
      .delete()
      .eq("token", token);

    return NextResponse.json(
      { error: "انتهت صلاحية الرابط — اطلب من الإدارة إرسال رابط جديد" },
      { status: 400 }
    );
  }

  // ==========================================
  // تشفير كلمة المرور الجديدة
  // ==========================================
  const newHash = await bcrypt.hash(newPassword, 12);

  // تحديث كلمة المرور في جدول users
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", record.user_id);

  if (updateError) {
    console.error("خطأ في تحديث كلمة المرور:", updateError);
    return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 });
  }

  // ==========================================
  // حذف التوكن فوراً بعد الاستخدام
  // الرابط يصبح بلا قيمة حتى لو اتسرّب
  // ==========================================
  await supabaseAdmin
    .from("password_reset_tokens")
    .delete()
    .eq("token", token);

  return NextResponse.json({ message: "تم تحديث كلمة المرور بنجاح" });
}
