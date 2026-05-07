import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
});

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // ساعة واحدة

// ==========================================
// POST /api/auth/forgot-password
// المستخدم (ولي أمر أو مدرب) يطلب إعادة تعيين كلمة مرور بنفسه
//
// أمان مهم: نرجع نفس الرسالة سواء الإيميل موجود أو لا
// عشان نمنع "email enumeration" — اكتشاف إيميلات مسجلة
// ==========================================
export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بريد إلكتروني غير صحيح" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // الرسالة الثابتة اللي بنرجعها في كل الحالات
  const successResponse = NextResponse.json({
    message: "إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين خلال دقائق",
  });

  // البحث عن المستخدم بالإيميل
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // لو الإيميل مش موجود — نرجع نفس الرسالة بدون كشف ذلك (أمان)
  if (!user) return successResponse;

  // توليد توكن عشوائي آمن
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

  // حذف أي توكنات قديمة لنفس المستخدم
  await supabaseAdmin
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", user.id);

  // حفظ التوكن الجديد
  const { error: insertError } = await supabaseAdmin
    .from("password_reset_tokens")
    .insert({ user_id: user.id, token, expires_at: expiresAt });

  if (insertError) {
    console.error("خطأ في حفظ التوكن:", insertError);
    return successResponse; // نرجع نجاح حتى لو فيه خطأ داخلي (أمان)
  }

  // بناء رابط إعادة التعيين
  const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // إرسال الإيميل
  await getResendClient().emails.send({
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

          <p style="font-size:16px;color:white;margin:0 0 8px;font-weight:600;">مرحباً ${user.name}،</p>
          <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0 0 28px;line-height:1.7;">
            طلبت إعادة تعيين كلمة مرور حسابك في أكاديمية طنطا للسباحة.
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
            إذا لم تطلب إعادة التعيين، تجاهل هذا الإيميل — حسابك آمن.<br/>
            © ${new Date().getFullYear()} أكاديمية طنطا للسباحة
          </p>
        </div>
      </body>
      </html>
    `,
  });

  return successResponse;
}
