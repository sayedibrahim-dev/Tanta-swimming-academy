import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { resend, FROM_EMAIL } from "@/lib/resend";
import crypto from "crypto";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // ساعة واحدة

// ==========================================
// POST /api/admin/coaches/[id]/send-reset
// نفس منطق ولي الأمر تماماً — الأدمن لا يعرف الباسورد الجديد
// ==========================================
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id: coachId } = await params;

  // جلب بيانات المدرب (user_id + email + name)
  const { data: coach, error: fetchError } = await supabaseAdmin
    .from("coaches")
    .select("id, name, user_id, user:users(email)")
    .eq("id", coachId)
    .single();

  if (fetchError || !coach) {
    return NextResponse.json({ error: "المدرب غير موجود" }, { status: 404 });
  }

  const email = (coach.user as unknown as { email: string } | null)?.email;
  if (!email) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني لهذا الحساب" }, { status: 400 });
  }

  // توليد توكن عشوائي آمن
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

  // حذف التوكنات القديمة لنفس المستخدم
  await supabaseAdmin
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", coach.user_id);

  // حفظ التوكن الجديد
  const { error: insertError } = await supabaseAdmin
    .from("password_reset_tokens")
    .insert({ user_id: coach.user_id, token, expires_at: expiresAt });

  if (insertError) {
    console.error("خطأ في حفظ التوكن:", insertError);
    return NextResponse.json({ error: "حدث خطأ، حاول مرة أخرى" }, { status: 500 });
  }

  // بناء رابط إعادة التعيين
  const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // إرسال الإيميل
  const { error: emailError } = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      email,
    subject: "إعادة تعيين كلمة مرور — أكاديمية طنطا للسباحة",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#060D1E;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
        <div style="max-width:520px;margin:40px auto;padding:40px 32px;background:#0A1628;border:1px solid rgba(212,175,55,0.2);border-radius:16px;">

          <div style="text-align:center;margin-bottom:32px;">
            <p style="font-size:22px;font-weight:900;color:white;margin:0 0 4px;">أكاديمية طنطا للسباحة</p>
            <p style="font-size:12px;color:rgba(212,175,55,0.85);margin:0;letter-spacing:0.1em;">TANTA SWIMMING ACADEMY</p>
          </div>

          <div style="height:1px;background:linear-gradient(to left,transparent,rgba(212,175,55,0.4),transparent);margin-bottom:32px;"></div>

          <p style="font-size:16px;color:white;margin:0 0 8px;font-weight:600;">مرحباً ${coach.name}،</p>
          <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0 0 28px;line-height:1.7;">
            تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك في أكاديمية طنطا للسباحة.
            اضغط على الزر أدناه لتحديد كلمة مرور جديدة.
          </p>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#8B6914,#F5E178,#D4AF37,#F5E178,#8B6914);color:#0A1628;font-size:15px;font-weight:800;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.03em;">
              تعيين كلمة مرور جديدة
            </a>
          </div>

          <p style="font-size:12px;color:rgba(255,255,255,0.35);text-align:center;margin:0 0 24px;">⏱ الرابط صالح لمدة ساعة واحدة فقط</p>

          <div style="height:1px;background:linear-gradient(to left,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:20px;"></div>

          <p style="font-size:11px;color:rgba(255,255,255,0.25);text-align:center;margin:0;line-height:1.6;">
            إذا لم تطلب إعادة التعيين، تجاهل هذا الإيميل.<br/>
            © ${new Date().getFullYear()} أكاديمية طنطا للسباحة
          </p>
        </div>
      </body>
      </html>
    `,
  });

  if (emailError) {
    console.error("خطأ في إرسال الإيميل:", emailError);
    await supabaseAdmin.from("password_reset_tokens").delete().eq("token", token);
    return NextResponse.json({ error: "تعذّر إرسال الإيميل، تحقق من الإيميل وحاول مرة أخرى" }, { status: 500 });
  }

  return NextResponse.json({ message: "تم إرسال الرابط بنجاح", email });
}
