// صفحة التقارير — Server Component للتحقق من الصلاحيات فقط
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

// منع الـ caching عشان البيانات دايماً حديثة
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {

  // التحقق من أن المستخدم أدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  return (
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">التقارير</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          أنشئ تقريراً شاملاً حسب احتياجك وقم بطباعته
        </p>
      </div>

      {/* المكوّن التفاعلي */}
      <ReportsClient />
    </div>
  );
}
