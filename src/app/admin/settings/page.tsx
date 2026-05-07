export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          إدارة بيانات حسابك
        </p>
      </div>
      <SettingsClient />
    </div>
  );
}
