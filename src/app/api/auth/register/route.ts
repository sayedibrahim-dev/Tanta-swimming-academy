import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

// ==========================================
// التحقق من صحة البيانات على الـ Server أيضاً
// (لا نثق فقط بالتحقق في الـ Frontend)
// ==========================================
const registerSchema = z.object({
  name: z.string().min(3),
  phone: z.string().regex(/^01[0-9]{9}$/),
  national_id: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // التحقق من صحة البيانات
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "البيانات المُرسَلة غير صحيحة" },
        { status: 400 }
      );
    }

    const { name, phone, national_id, email, password } = parsed.data;

    // ==========================================
    // التحقق من عدم تكرار البريد الإلكتروني
    // ==========================================
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }

    // ==========================================
    // تشفير كلمة المرور (لا تُخزَّن أبداً كنص عادي)
    // الرقم 12 هو "cost factor" — كلما زاد، زاد الأمان وتأخر التشفير
    // ==========================================
    const passwordHash = await bcrypt.hash(password, 12);

    // ==========================================
    // إنشاء سجل المستخدم في جدول users
    // ==========================================
    const { data: newUser, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        phone,
        email,
        password_hash: passwordHash,
        role: "parent",
      })
      .select("id")
      .single();

    if (userError || !newUser) {
      console.error("خطأ في إنشاء المستخدم:", userError);
      return NextResponse.json(
        { error: "حدث خطأ أثناء إنشاء الحساب" },
        { status: 500 }
      );
    }

    // ==========================================
    // إنشاء سجل ولي الأمر في جدول parents
    // مرتبط بالمستخدم الذي أنشأناه للتو
    // ==========================================
    const { error: parentError } = await supabaseAdmin
      .from("parents")
      .insert({
        user_id: newUser.id,
        name,
        phone,
        national_id: national_id || null,
      });

    if (parentError) {
      // إذا فشل إنشاء ولي الأمر، نحذف المستخدم لتجنب بيانات معلقة
      await supabaseAdmin.from("users").delete().eq("id", newUser.id);
      console.error("خطأ في إنشاء ولي الأمر:", parentError);
      return NextResponse.json(
        { error: "حدث خطأ أثناء إنشاء الحساب" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح" },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
