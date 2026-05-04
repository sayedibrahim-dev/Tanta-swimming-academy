// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// ==========================================
// Handler الـ PATCH — تغيير الإيميل أو الباسورد
// المسار: PATCH /api/coach/settings
//
// بيستقبل { type: "email" | "password" } في الـ body
// لو "email"    → يغيّر الإيميل بعد التحقق من الباسورد الحالي
// لو "password" → يغيّر الباسورد بعد التحقق من الباسورد الحالي
// ==========================================
export async function PATCH(req: NextRequest) {

  // التحقق من أن المستخدم مسجل دخوله وله دور "coach"
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // قراءة البيانات من الـ body
  const body = await req.json();
  const { type } = body; // نوع التغيير: "email" أو "password"

  // التحقق من نوع العملية المطلوبة
  if (type !== "email" && type !== "password") {
    return NextResponse.json({ error: "نوع العملية غير صحيح" }, { status: 400 });
  }

  // ==========================================
  // جلب بيانات المستخدم الحالي من DB
  // محتاجين الـ password_hash للتحقق من الباسورد الحالي
  // ==========================================
  const { data: user, error: userFetchError } = await supabaseAdmin
    .from("users")
    .select("id, email, password_hash") // بنحتاج الإيميل والهاش للتحقق
    .eq("id", session.user.id)          // المستخدم المسجل دخوله حالياً
    .single();

  // لو مش لاقيين المستخدم — خطأ غير متوقع
  if (userFetchError || !user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  // استيراد bcryptjs للتحقق من الباسورد
  const bcrypt = await import("bcryptjs");

  // ==========================================
  // حالة تغيير الإيميل
  // ==========================================
  if (type === "email") {
    const { newEmail, currentPassword } = body;

    // التحقق من وجود البيانات المطلوبة
    if (!newEmail || !currentPassword) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    // التحقق من صيغة الإيميل الجديد — regex صحيح بدلاً من includes("@") الضعيف
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
    }

    // التحقق من الباسورد الحالي قبل السماح بالتغيير
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "كلمة السر الحالية غير صحيحة" }, { status: 400 });
    }

    // التحقق من عدم تكرار الإيميل الجديد مع مستخدم آخر
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", newEmail.trim())
      .single();

    // لو الإيميل مستخدم من شخص آخر — ارجع بخطأ
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ error: "هذا البريد الإلكتروني مستخدم مسبقاً" }, { status: 409 });
    }

    // تحديث الإيميل في قاعدة البيانات
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email: newEmail.trim() }) // الإيميل الجديد
      .eq("id", user.id);

    // لو فشل التحديث
    if (updateError) {
      console.error("خطأ في تحديث الإيميل:", updateError);
      return NextResponse.json({ error: "حدث خطأ أثناء تحديث البريد" }, { status: 500 });
    }

    return NextResponse.json({ message: "تم تغيير البريد الإلكتروني بنجاح" });
  }

  // ==========================================
  // حالة تغيير الباسورد
  // ==========================================
  if (type === "password") {
    const { currentPassword, newPassword } = body;

    // التحقق من وجود البيانات المطلوبة
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    // التحقق من طول الباسورد الجديد
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "كلمة السر يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    }

    // التحقق من الباسورد الحالي قبل السماح بالتغيير
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "كلمة السر الحالية غير صحيحة" }, { status: 400 });
    }

    // تشفير الباسورد الجديد قبل حفظه
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // تحديث الباسورد في قاعدة البيانات
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: newPasswordHash }) // الباسورد الجديد مشفر
      .eq("id", user.id);

    // لو فشل التحديث
    if (updateError) {
      console.error("خطأ في تحديث الباسورد:", updateError);
      return NextResponse.json({ error: "حدث خطأ أثناء تحديث كلمة السر" }, { status: 500 });
    }

    return NextResponse.json({ message: "تم تغيير كلمة السر بنجاح" });
  }
}
