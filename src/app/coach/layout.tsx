export const dynamic = "force-dynamic"; // لمنع cache الجلسة — يجب أن يُعاد التحقق في كل طلب
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();

  if (!session) redirect("/login");
  if (session.user.role !== "coach") redirect(`/${session.user.role}`);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={session.user.role} userName={session.user.name} />
      <main className="mr-64 min-h-screen">{children}</main>
    </div>
  );
}
