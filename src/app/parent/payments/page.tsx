export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import PaymentUploadCard from "./PaymentUploadCard";
import { CreditCard } from "lucide-react";

// أسماء الشهور بالعربية
const monthNames = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default async function PaymentsPage() {
  const session = await getAppSession();
  if (!session || session.user.role !== "parent") redirect("/login");
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // جلب السباحين النشطين فقط (غير المقبولين لا يدفعون)
  const { data: swimmers } = await supabaseAdmin
    .from("swimmers")
    .select("id, name, age, level")
    .eq("parent_id", session.user.profileId)
    .eq("status", "active");

  // جلب حالة الدفع لهذا الشهر لكل سباح
  // نتحقق أولاً من وجود سباحين لتجنب .in() بـ array فارغة
  const swimmerIds = swimmers?.map((s) => s.id) ?? [];
  const { data: payments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("id, swimmer_id, status, receipt_image_url, created_at")
        .in("swimmer_id", swimmerIds)  // فقط لو في سباحين فعلاً
        .eq("month", currentMonth)
        .eq("year", currentYear)
    : { data: [] }; // لو مفيش سباحين — نرجع قائمة فارغة مباشرة

  // تحويل المدفوعات لـ map لسهولة الوصول بالـ swimmer_id
  const paymentMap = new Map(payments?.map((p) => [p.swimmer_id, p]) ?? []);

  return (
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">المدفوعات الشهرية</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {monthNames[currentMonth]} {currentYear}
        </p>
      </div>

      {/* لا يوجد سباحون نشطون */}
      {(!swimmers || swimmers.length === 0) && (
        <div
          className="rounded-xl p-12 text-center border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-white font-medium mb-1">لا يوجد سباحون نشطون</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            سيظهر هنا إيصالات الدفع بعد قبول طلبات الالتحاق
          </p>
        </div>
      )}

      {/* ==========================================
          بطاقة دفع لكل سباح نشط
          ========================================== */}
      <div className="space-y-4">
        {swimmers?.map((swimmer: any) => {
          const payment = paymentMap.get(swimmer.id);
          return (
            <PaymentUploadCard
              key={swimmer.id}
              swimmer={swimmer}
              payment={payment ?? null}
              currentMonth={currentMonth}
              currentYear={currentYear}
              monthName={monthNames[currentMonth]}
            />
          );
        })}
      </div>
    </div>
  );
}
