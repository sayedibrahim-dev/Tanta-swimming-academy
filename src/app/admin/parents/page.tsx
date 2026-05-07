// تعطيل الـ cache — الصفحة دايماً تجيب أحدث بيانات
export const dynamic = "force-dynamic";

// استيراد دالة جلب الجلسة
import { getAppSession } from "@/lib/auth";

// استيراد Supabase بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد redirect للتوجيه
import { redirect } from "next/navigation";

// استيراد المكوّن الـ Client
import ParentsClient from "./ParentsClient";

// ==========================================
// نوع بيانات ولي الأمر لتمريرها للـ Client
// ==========================================
export interface ParentItem {
  id:       string;        // معرف ولي الأمر في جدول parents
  name:     string;        // اسمه
  phone:    string | null; // رقم تليفونه
  user: {
    email: string;         // إيميله (من جدول users)
  } | null;
  swimmers: { name: string }[]; // أسماء أبنائه النشطين
}

// ==========================================
// صفحة أولياء الأمور — Server Component
// ==========================================
export default async function AdminParentsPage() {

  // التحقق من أن المستخدم أدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  // جلب كل أولياء الأمور مع إيميلاتهم وأسماء أبنائهم النشطين
  const { data: parents } = await supabaseAdmin
    .from("parents")
    .select(`
      id,
      name,
      phone,
      user:users ( email ),
      swimmers ( name )
    `)
    .order("name", { ascending: true }); // ترتيب أبجدي

  return (
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">أولياء الأمور</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          إدارة حسابات أولياء الأمور
        </p>
      </div>

      {/* المكوّن الـ Client */}
      <ParentsClient
        initialParents={(parents as unknown as ParentItem[]) ?? []}
      />
    </div>
  );
}
