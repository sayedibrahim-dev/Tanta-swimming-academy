export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, ClipboardList, CreditCard, GraduationCap } from "lucide-react";

// ==========================================
// بطاقة الإحصاء - مكون مساعد صغير
// ==========================================
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: "cyan" | "gold" | "red" | "green";
  description?: string;
}) {
  // تحديد الألوان حسب النوع
  const colorMap = {
    cyan: { bg: "var(--cyan-muted)", text: "var(--cyan)", border: "var(--cyan)" },
    gold: { bg: "var(--gold-muted)", text: "var(--gold)", border: "var(--gold)" },
    red: { bg: "oklch(0.65 0.22 25 / 15%)", text: "oklch(0.65 0.22 25)", border: "oklch(0.65 0.22 25 / 40%)" },
    green: { bg: "oklch(0.65 0.18 145 / 15%)", text: "oklch(0.72 0.2 145)", border: "oklch(0.65 0.18 145 / 40%)" },
  };

  const colors = colorMap[color];

  return (
    <div className="rounded-xl p-5 border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>
            {title}
          </p>
          {/* الرقم الرئيسي */}
          <p className="text-3xl font-bold text-white">{value}</p>
          {description && (
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {description}
            </p>
          )}
        </div>
        {/* أيقونة الإحصاء */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: colors.bg }}>
          <Icon className="w-6 h-6" style={{ color: colors.text }} />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// صفحة Dashboard الإدارة - Server Component
// تجلب الإحصاءات مباشرة من قاعدة البيانات
// ==========================================
export default async function AdminDashboard() {
  const session = await getAppSession();

  // الشهر والسنة الحاليان لحساب غير المدفوعين ديناميكياً
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  // جلب الإحصاءات بشكل متوازٍ لتسريع التحميل
  const [
    { count: totalSwimmers },
    { count: pendingRequests },
    { data: activeSwimmerIds },  // بنجيب IDs بدل count — لحساب المدفوعين ديناميكياً
    { count: totalCoaches },
  ] = await Promise.all([
    // إجمالي السباحين النشطين
    supabaseAdmin
      .from("swimmers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    // طلبات الالتحاق المعلقة
    supabaseAdmin
      .from("enrollment_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),

    // جلب معرفات السباحين النشطين لحساب المدفوعين من payments table
    supabaseAdmin
      .from("swimmers")
      .select("id")
      .eq("status", "active"),

    // إجمالي المدربين
    supabaseAdmin
      .from("coaches")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
  ]);

  // حساب عدد غير المدفوعين هذا الشهر ديناميكياً من جدول payments
  const allIds = activeSwimmerIds?.map((s) => s.id) ?? [];
  const { data: paidThisMonth } = allIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", allIds)
        .eq("month", currentMonth)
        .eq("year",  currentYear)
        .eq("status", "approved")
    : { data: [] };

  // عدد غير المدفوعين = إجمالي النشطين - المدفوعون هذا الشهر
  const unpaidSwimmers = (totalSwimmers ?? 0) - (paidThisMonth?.length ?? 0);

  return (
    <div className="p-8">

      {/* ==========================================
          رأس الصفحة - الترحيب
          ========================================== */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          مرحباً، {session?.user.name} 👋
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          إليك ملخص أكاديمية طنطا للسباحة اليوم
        </p>
      </div>

      {/* ==========================================
          بطاقات الإحصاءات - شبكة 2×2
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="إجمالي السباحين"
          value={totalSwimmers ?? 0}
          icon={Users}
          color="cyan"
          description="السباحون النشطون"
        />
        <StatCard
          title="طلبات معلقة"
          value={pendingRequests ?? 0}
          icon={ClipboardList}
          color="gold"
          description="تحتاج مراجعتك"
        />
        <StatCard
          title="غير مدفوعين"
          value={unpaidSwimmers ?? 0}
          icon={CreditCard}
          color="red"
          description="هذا الشهر"
        />
        <StatCard
          title="المدربون"
          value={totalCoaches ?? 0}
          icon={GraduationCap}
          color="green"
          description="مدربون نشطون"
        />
      </div>

      {/* ==========================================
          تنبيه إذا كانت هناك طلبات معلقة
          ========================================== */}
      {(pendingRequests ?? 0) > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3 glow-gold"
          style={{
            background: "var(--gold-muted)",
            border: "1px solid var(--gold)",
          }}>
          <ClipboardList className="w-5 h-5 flex-shrink-0" style={{ color: "var(--gold)" }} />
          <div>
            <p className="font-medium" style={{ color: "var(--gold)" }}>
              يوجد {pendingRequests} طلب التحاق ينتظر مراجعتك
            </p>
            <a href="/admin/requests" className="text-sm underline" style={{ color: "var(--gold)" }}>
              اضغط هنا للمراجعة
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
