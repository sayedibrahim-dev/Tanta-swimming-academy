// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد مكتبة Zod للتحقق من صحة البيانات
import { z } from "zod";

// ==========================================
// Schema للتحقق من بيانات المدرب الجديد
// بدون password — النظام بيولّده تلقائياً
// ==========================================
const createCoachSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(10, "رقم التليفون غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

// ==========================================
// دالة توليد باسورد مؤقت عشوائي
// بتنتج باسورد من 12 حرف يحتوي على:
// حروف كبيرة + حروف صغيرة + أرقام
// ==========================================
function generateTempPassword(): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // حروف كبيرة (بدون I و O المتشابهة)
  const lowercase = "abcdefghjkmnpqrstuvwxyz";  // حروف صغيرة (بدون l و o المتشابهة)
  const numbers = "23456789";                    // أرقام (بدون 0 و 1 المتشابهة)
  const all = uppercase + lowercase + numbers;   // كل الأحرف الممكنة

  let password = "";

  // ضمان وجود حرف كبير على الأقل
  password += uppercase[Math.floor(Math.random() * uppercase.length)];

  // ضمان وجود حرف صغير على الأقل
  password += lowercase[Math.floor(Math.random() * lowercase.length)];

  // ضمان وجود رقم على الأقل
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // إكمال باقي الباسورد (9 أحرف) من كل الأحرف الممكنة
  for (let i = 0; i < 9; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // خلط الأحرف بـ Fisher-Yates (أصح إحصائياً من sort())
  const arr = password.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

// ==========================================
// Handler الـ POST — إنشاء مدرب جديد
// المسار: POST /api/admin/coaches
//
// المنطق:
// 1. التحقق من الأدمن
// 2. التحقق من عدم تكرار الإيميل
// 3. توليد باسورد مؤقت تلقائياً
// 4. تشفير الباسورد وإنشاء سجل في users (role = 'coach')
// 5. إنشاء سجل في coaches مرتبط بالـ user
// 6. إرجاع الباسورد المؤقت للأدمن (مرة واحدة فقط)
// ==========================================
export async function POST(req: NextRequest) {

  // التحقق من أن المستخدم أدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // قراءة البيانات من الـ body والتحقق منها
  const body = await req.json();
  const parsed = createCoachSchema.safeParse(body);

  // لو البيانات غير صحيحة — ارجع بخطأ مع تفاصيل المشكلة
  if (!parsed.success) {
    // استخراج أول رسالة خطأ من Zod (في Zod v4 بقت issues بدل errors)
    const firstError = parsed.error.issues[0]?.message ?? "البيانات غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { name, phone, email } = parsed.data;

  // التحقق من عدم تكرار الإيميل في قاعدة البيانات
  // maybeSingle بدل single — لأن عدم الوجود هو الحالة الطبيعية عند إنشاء مدرب جديد
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  // لو الإيميل موجود مسبقاً — ارجع بخطأ
  if (existingUser) {
    return NextResponse.json(
      { error: "هذا البريد الإلكتروني مسجل مسبقاً" },
      { status: 409 }
    );
  }

  // ==========================================
  // توليد باسورد مؤقت عشوائي
  // هيتعرض للأدمن مرة واحدة فقط بعد الإنشاء
  // ==========================================
  const tempPassword = generateTempPassword();

  // تشفير الباسورد المؤقت بـ bcrypt قبل حفظه في DB
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // إنشاء سجل المستخدم في جدول users
  const { data: newUser, error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      email,
      password_hash: passwordHash, // الباسورد مشفر — مش ممكن حد يعرف قيمته الأصلية
      name,
      phone,
      role: "coach",
    })
    .select("id")
    .single();

  // لو فشل إنشاء المستخدم — ارجع بخطأ
  if (userError || !newUser) {
    console.error("خطأ في إنشاء المستخدم:", userError);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الحساب" }, { status: 500 });
  }

  // إنشاء سجل المدرب في جدول coaches مرتبطاً بالـ user
  const { data: newCoach, error: coachError } = await supabaseAdmin
    .from("coaches")
    .insert({
      user_id: newUser.id, // ربط الـ coach بالـ user
      name,
      phone,
      active: true,
    })
    .select("id, user_id, name, phone")
    .single();

  // لو فشل إنشاء سجل المدرب — احذف الـ user (تراجع)
  if (coachError || !newCoach) {
    console.error("خطأ في إنشاء سجل المدرب:", coachError);
    await supabaseAdmin.from("users").delete().eq("id", newUser.id);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء سجل المدرب" }, { status: 500 });
  }

  // ==========================================
  // إرجاع بيانات الـ coach + الباسورد المؤقت
  // الباسورد بيتعرض هنا مرة واحدة بس للأدمن
  // بعد ما يتعرض مش بيتخزن في أي مكان غير DB مشفر
  // ==========================================
  return NextResponse.json(
    {
      message: "تم إضافة المدرب بنجاح",
      coach: newCoach,
      tempPassword, // الباسورد المؤقت — الأدمن يبعته للمدرب
    },
    { status: 201 }
  );
}
