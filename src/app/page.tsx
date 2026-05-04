export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// ==========================================
// الصفحة الرئيسية - توجيه ذكي حسب الجلسة
// ==========================================
export default async function RootPage() {
  const session = await getAppSession();

  if (!session) {
    // غير مسجل الدخول → صفحة تسجيل الدخول
    redirect("/login");
  }

  // مسجل الدخول → صفحة دوره مباشرة
  redirect(`/${session.user.role}`);
}
