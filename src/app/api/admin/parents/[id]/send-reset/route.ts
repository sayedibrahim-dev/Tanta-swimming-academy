import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { resend, FROM_EMAIL } from "@/lib/resend";
import crypto from "crypto";

// مدة صلاحية التوكن — ساعة واحدة
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// ==========================================
// POST /api/admin/parents/[id]/send-reset
// الأدمن يطلب إرسال رابط إعادة تعيين كلمة المرور لولي الأمر
// ولي الأمر بنفسه هو اللي بيحدد كلمة المرور الجديدة
// الأدمن لا يعرف الكلمة الجديدة في أي وقت
// ==========================================
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // التحقق من أن الطالب أدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id: parentId } = await params;

  // ==========================================
  // جلب بيانات ولي الأمر (user_id + email + name)
  // ==========================================
  const { data: parent, error: fetchError } = await supabaseAdmin
    .from("parents")
    .select("id, name, user_id, user:users(email)")
    .eq("id", parentId)
    .single();

  if (fetchError || !parent) {
    return NextResponse.json({ error: "ولي الأمر غير موجود" }, { status: 404 });
  }

  // استخراج الإيميل من الـ join
  const email = (parent.user as unknown as { email: string } | null)?.email;
  if (!email) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني لهذا الحساب" }, { status: 400 });
  }

  // ==========================================
  // توليد توكن عشوائي آمن
  // 32 byte = 64 حرف hex — يكاد يكون مستحيل تخمينه
  // ==========================================
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

  // ==========================================
  // حذف أي توكنات قديمة لنفس المستخدم قبل الإنشاء
  // عشان ميبقاش في أكتر من رابط نشط في نفس الوقت
  // ==========================================
  await supabaseAdmin
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", parent.user_id);

  // حفظ التوكن الجديد في قاعدة البيانات
  const { error: insertError } = await supabaseAdmin
    .from("password_reset_tokens")
    .insert({ user_id: parent.user_id, token, expires_at: expiresAt });

  if (insertError) {
    console.error("خطأ في حفظ التوكن:", insertError);
    return NextResponse.json({ error: "حدث خطأ، حاول مرة أخرى" }, { status: 500 });
  }

  // ==========================================
  // بناء رابط إعادة التعيين
  // NEXTAUTH_URL = عنوان التطبيق (localhost أو domain الإنتاج)
  // ==========================================
  const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // ==========================================
  // إرسال الإيميل عبر Resend
  // ==========================================
  const { error: emailError } = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      email,
    subject: "إعادة تعيين كلمة مرور — أكاديمية طنطا للسباحة",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="
        margin: 0; padding: 0;
        background: #060D1E;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
      ">
        <div style="
          max-width: 520px; margin: 40px auto; padding: 40px 32px;
          background: #0A1628;
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 16px;
        ">

          <!-- اللوجو والعنوان -->
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="
              font-size: 22px; font-weight: 900;
              color: white; margin: 0 0 4px;
            ">
              أكاديمية طنطا للسباحة
            </p>
            <p style="font-size: 12px; color: rgba(212,175,55,0.85); margin: 0; letter-spacing: 0.1em;">
              TANAT SWIMMING ACADEMY
            </p>
          </div>

          <!-- الخط الفاصل الذهبي -->
          <div style="
            height: 1px;
            background: linear-gradient(to left, transparent, rgba(212,175,55,0.4), transparent);
            margin-bottom: 32px;
          "></div>

          <!-- المحتوى -->
          <p style="font-size: 16px; color: white; margin: 0 0 8px; font-weight: 600;">
            مرحباً ${parent.name}،
          </p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.65); margin: 0 0 28px; line-height: 1.7;">
            تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك في أكاديمية طنطا للسباحة.
            اضغط على الزر أدناه لتحديد كلمة مرور جديدة.
          </p>

          <!-- زرار الرابط -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                background: linear-gradient(135deg, #8B6914, #F5E178, #D4AF37, #F5E178, #8B6914);
                color: #0A1628;
                font-size: 15px; font-weight: 800;
                padding: 14px 36px;
                border-radius: 12px;
                text-decoration: none;
                letter-spacing: 0.03em;
              "
            >
              تعيين كلمة مرور جديدة
            </a>
          </div>

          <!-- تحذير الصلاحية -->
          <p style="
            font-size: 12px; color: rgba(255,255,255,0.35);
            text-align: center; margin: 0 0 24px;
          ">
            ⏱ الرابط صالح لمدة ساعة واحدة فقط
          </p>

          <!-- الخط الفاصل -->
          <div style="
            height: 1px;
            background: linear-gradient(to left, transparent, rgba(255,255,255,0.08), transparent);
            margin-bottom: 20px;
          "></div>

          <!-- تذييل -->
          <p style="
            font-size: 11px; color: rgba(255,255,255,0.25);
            text-align: center; margin: 0; line-height: 1.6;
          ">
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
    // نحذف التوكن لو الإيميل فشل — عشان ميبقاش توكن بدون إيميل
    await supabaseAdmin
      .from("password_reset_tokens")
      .delete()
      .eq("token", token);
    return NextResponse.json({ error: "تعذّر إرسال الإيميل، تحقق من الإيميل وحاول مرة أخرى" }, { status: 500 });
  }

  // نجح كل حاجة — نرجع الإيميل المُرسَل إليه للعرض في الـ UI
  return NextResponse.json({ message: "تم إرسال الرابط بنجاح", email });
}
