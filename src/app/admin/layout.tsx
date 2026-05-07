export const dynamic = "force-dynamic"; // لمنع cache الجلسة — يجب أن يُعاد التحقق في كل طلب
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect(`/${session.user.role}`);

  // ==========================================
  // جلب عدد العناصر المعلقة لبادجات الـ Sidebar
  // نفّذ الاستعلامين بالتوازي عشان نوفر وقت
  // count: "exact" = نريد العدد فقط بدون جلب البيانات
  // ==========================================
  const [{ count: pendingRequests }, { count: pendingPayments }] = await Promise.all([
    // طلبات الالتحاق المنتظرة
    supabaseAdmin
      .from("enrollment_requests")
      .select("*", { count: "exact", head: true }) // head: true = لا ترجع صفوف، عدد فقط
      .eq("status", "pending"),

    // المدفوعات المنتظرة مراجعتها
    supabaseAdmin
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  // بناء الـ map: href الصفحة → العدد المعلق
  // الـ Sidebar بيستخدمه لتحديد أي item يعرض بادج
  const pendingCounts: Record<string, number> = {
    "/admin/requests": pendingRequests ?? 0,
    "/admin/payments": pendingPayments ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* نمرر البادجات مع بيانات المستخدم */}
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name}
        pendingCounts={pendingCounts}
      />
      {/* على الموبايل: بدون margin + padding علوي للهامبرغر */}
      {/* على الكمبيوتر: margin يمين 64 للـ sidebar */}
      <main className="md:mr-64 min-h-screen pt-14 md:pt-0">{children}</main>
    </div>
  );
}
