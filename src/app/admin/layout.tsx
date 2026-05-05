export const dynamic = "force-dynamic"; // لمنع cache الجلسة — يجب أن يُعاد التحقق في كل طلب
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect(`/${session.user.role}`);

  return (
    <div className="min-h-screen bg-background">
      {/* نمرر فقط strings — لا أيقونات ولا objects معقدة */}
      <Sidebar userRole={session.user.role} userName={session.user.name} />
      {/* على الموبايل: بدون margin + padding علوي للهامبرغر */}
      {/* على الكمبيوتر: margin يمين 64 للـ sidebar */}
      <main className="md:mr-64 min-h-screen pt-14 md:pt-0">{children}</main>
    </div>
  );
}
