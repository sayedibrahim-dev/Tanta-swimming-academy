export const dynamic = "force-dynamic";
// استيراد دالة جلب الجلسة للتحقق من المستخدم المسجل

// استيراد دالة التوجيه لإعادة توجيه المستخدم غير المصرح له
import { redirect } from "next/navigation";

// استيراد إعدادات المصادقة
import { getAppSession } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد المكوّن التفاعلي لعرض وإدارة المدربين
import CoachesClient from "./CoachesClient";

// صفحة إدارة المدربين — Server Component (تشتغل على السيرفر)
export default async function AdminCoachesPage() {

  // التحقق من أن المستخدم مسجل دخوله وله صلاحية الأدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  // جلب المدربين مع إيميل كل مدرب وعدد سباحيه
  const { data: coaches } = await supabaseAdmin
    .from("coaches")          // من جدول المدربين
    .select(`
      id,
      name,
      phone,
      active,
      user_id,
      user:users(email),
      swimmers:swimmers(count)
    `)
    // user:users(email)       → جلب إيميل المدرب من جدول users
    // swimmers:swimmers(count) → عدد السباحين المرتبطين بهذا المدرب
    .order("name"); // مرتبين أبجدياً حسب الاسم

  return (
    // حاوية الصفحة
    <div className="p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">إدارة المدربين</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {coaches?.length ?? 0} مدرب مسجل في النظام
        </p>
      </div>

      {/* المكوّن التفاعلي — يستقبل قائمة المدربين */}
      <CoachesClient
        initialCoaches={(coaches ?? []) as unknown as CoachItem[]}
      />
    </div>
  );
}

// ==========================================
// تعريف شكل بيانات المدرب الواحد
// ==========================================
export interface CoachItem {
  id: string;         // معرف المدرب في جدول coaches
  name: string;       // اسم المدرب
  phone: string;      // رقم تليفون المدرب
  active: boolean;    // هل المدرب نشط؟
  user_id: string;    // معرف المدرب في جدول users (لو احتجنا نحذف الـ user)
  user: {
    email: string;    // إيميل المدرب من جدول users
  } | null;
  swimmers: {
    count: number;    // عدد السباحين المرتبطين بهذا المدرب
  }[];
}
