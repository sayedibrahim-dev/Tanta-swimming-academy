export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, CreditCard, Clock, BellRing, ArrowLeft, UserPlus, Sparkles } from "lucide-react";
import { simulatedNow } from "@/lib/now";

// ==========================================
// أسماء الشهور بالعربية
// ==========================================
const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ==========================================
// صفحة Dashboard ولي الأمر — Server Component
// ==========================================
export default async function ParentDashboard() {

  // جلب بيانات الجلسة للحصول على اسم ولي الأمر ومعرفه
  const session = await getAppSession();

  // الشهر والسنة الحاليان لحساب حالة الدفع ديناميكياً
  const now          = simulatedNow(); // يدعم محاكاة التاريخ عبر SIMULATE_DATE
  // اسم الشهر الحالي بالعربية للرسالة الشهرية
  const currentMonthName = arabicMonths[now.getMonth()];
  const currentMonth = now.getMonth() + 1; // getMonth() يبدأ من 0
  const currentYear  = now.getFullYear();

  // جلب جميع أبناء ولي الأمر هذا مع حالتهم (بدون payment_status القديم)
  const { data: swimmers } = await supabaseAdmin
    .from("swimmers")
    .select("id, name, status") // payment_status محذوف — بيُحسب ديناميكياً من payments
    .eq("parent_id", session?.user.profileId);  // فقط أبناء ولي الأمر هذا

  // جلب الدفعات المقبولة لهذا الشهر للسباحين النشطين فقط
  const activeIds = swimmers?.filter((s) => s.status === "active").map((s) => s.id) ?? [];
  const { data: approvedPayments } = activeIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", activeIds)     // بس السباحين النشطين
        .eq("month", currentMonth)        // الشهر الحالي فقط
        .eq("year",  currentYear)         // السنة الحالية فقط
        .eq("status", "approved")         // المقبولة فقط
    : { data: [] };

  // Set من معرفات السباحين المدفوعين هذا الشهر — للبحث السريع O(1)
  const paidThisMonthIds = new Set(approvedPayments?.map((p) => p.swimmer_id) ?? []);

  // حساب الإحصاءات من البيانات المجلوبة (ديناميكياً)
  const activeCount  = swimmers?.filter((s) => s.status === "active").length  ?? 0;  // النشطون
  const pendingCount = swimmers?.filter((s) => s.status === "pending").length ?? 0;  // قيد الانتظار

  // أسماء السباحين الذين لم يُسدَّد اشتراكهم بعد (للرسالة الشهرية)
  // يُحسب من payments table لا من swimmers.payment_status القديم
  const unpaidSwimmers = swimmers?.filter(
    (s) => s.status === "active" && !paidThisMonthIds.has(s.id)
  ) ?? [];
  const unpaidCount = unpaidSwimmers.length; // عدد غير المدفوعين هذا الشهر

  // ==========================================
  // هل ولي الأمر جديد تماماً؟ (لا يوجد له أي سباح بأي حالة)
  // ده هو الشرط اللي بيطلع بيه الـ Onboarding Guide
  // ==========================================
  const hasNoSwimmers = !swimmers || swimmers.length === 0;

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* ==========================================
          رأس الصفحة — الترحيب بولي الأمر
          ========================================== */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          أهلاً، {session?.user.name}
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          متابعة أبنائك في أكاديمية طنطا للسباحة
        </p>
      </div>

      {/* ==========================================
          Onboarding Guide — يظهر فقط للمستخدمين الجدد اللي مسجلوش أي سباح
          لما يضيف أول سباح، الكارد ده بيختفي تلقائياً
          ========================================== */}
      {hasNoSwimmers && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--card)",
            border:     "1px solid var(--border)",
          }}
        >
          {/* رأس الكارد — ترحيب + أيقونة */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--cyan-muted)" }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">مرحباً بك في أكاديمية طنطا!</h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                ابدأ رحلة ابنك في ثلاث خطوات بسيطة
              </p>
            </div>
          </div>

          {/* ==========================================
              الخطوات الثلاث — على الكمبيوتر أفقية، على الموبايل رأسية
              ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            {/* ─── الخطوة ١ — أضف سباحك ─── */}
            <div
              className="flex flex-col items-center text-center p-4 rounded-xl gap-3"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              {/* دائرة الرقم */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
                style={{ background: "var(--cyan)", color: "#0A1628" }}
              >
                1
              </div>
              {/* أيقونة الخطوة */}
              <UserPlus className="w-7 h-7" style={{ color: "var(--cyan)" }} />
              {/* نص الخطوة */}
              <div>
                <p className="font-semibold text-white text-sm mb-1">أضف بيانات ابنك</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  اذهب لصفحة «أبنائي» واضغط على «إضافة سباح»، وأدخل اسمه وتاريخ ميلاده والمجموعة
                </p>
              </div>
            </div>

            {/* ─── الخطوة ٢ — انتظر الموافقة ─── */}
            <div
              className="flex flex-col items-center text-center p-4 rounded-xl gap-3"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
                style={{ background: "var(--gold)", color: "#0A1628" }}
              >
                2
              </div>
              <Clock className="w-7 h-7" style={{ color: "var(--gold)" }} />
              <div>
                <p className="font-semibold text-white text-sm mb-1">انتظر موافقة الإدارة</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  سيراجع فريق الأكاديمية طلبك خلال وقت قصير ويقبله في النظام
                </p>
              </div>
            </div>

            {/* ─── الخطوة ٣ — ادفع الاشتراك ─── */}
            <div
              className="flex flex-col items-center text-center p-4 rounded-xl gap-3"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
                style={{ background: "oklch(0.65 0.22 25)", color: "white" }}
              >
                3
              </div>
              <CreditCard className="w-7 h-7" style={{ color: "oklch(0.65 0.22 25)" }} />
              <div>
                <p className="font-semibold text-white text-sm mb-1">ادفع الاشتراك الشهري</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  توجّه للخزينة لسداد الاشتراك، ثم ارفع صورة الإيصال من صفحة «المدفوعات»
                </p>
              </div>
            </div>

          </div>

          {/* ─── زر الـ CTA ─── */}
          <div className="text-center">
            <a
              href="/parent/swimmers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{
                background: "var(--cyan)",
                color:      "#0A1628",
              }}
            >
              <UserPlus className="w-4 h-4" />
              أضف سباحك الآن
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ==========================================
          الرسالة الشهرية — تظهر عند وجود اشتراكات غير مدفوعة
          ========================================== */}
      {unpaidCount > 0 && (
        <div
          className="rounded-2xl p-5 glow-gold"
          style={{
            background: "var(--gold-muted)",
            border: "2px solid var(--gold)",
          }}
        >
          {/* رأس الرسالة مع الأيقونة */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "var(--gold)", opacity: 0.9 }}
            >
              <BellRing className="w-5 h-5" style={{ color: "var(--gold-foreground)" }} />
            </div>
            <div>
              {/* عنوان الرسالة */}
              <p className="font-bold text-base" style={{ color: "var(--gold)" }}>
                تذكير — اشتراك شهر {currentMonthName}
              </p>
              {/* نص الرسالة الشهرية */}
              <p className="text-sm mt-0.5" style={{ color: "var(--gold)" }}>
                يرجى التوجه للخزينة لسداد اشتراك هذا الشهر ورفع إيصال الدفع للسباحين التالين:
              </p>
            </div>
          </div>

          {/* قائمة أسماء السباحين غير المدفوعين */}
          <div className="mr-13 mb-4 space-y-1.5" style={{ marginRight: "52px" }}>
            {unpaidSwimmers.map((swimmer) => (
              // اسم كل سباح على حدة مع أيقونة صغيرة
              <div key={swimmer.id} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--gold)" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--gold)" }}>
                  {swimmer.name}
                </span>
              </div>
            ))}
          </div>

          {/* زر الانتقال لصفحة المدفوعات */}
          <div style={{ marginRight: "52px" }}>
            <a
              href="/parent/payments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "var(--gold)",
                color: "var(--gold-foreground)",
              }}
            >
              رفع إيصال الدفع الآن
              <ArrowLeft className="w-4 h-4" /> {/* سهم للتوجيه لصفحة الدفع */}
            </a>
          </div>
        </div>
      )}

      {/* ==========================================
          بطاقات الإحصاءات الثلاث
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* إجمالي الأبناء المسجلين */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>أبنائي المسجلون</p>
              <p className="text-3xl font-bold text-white mt-1">{activeCount}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--cyan-muted)" }}
            >
              <Users className="w-6 h-6" style={{ color: "var(--cyan)" }} />
            </div>
          </div>
        </div>

        {/* الطلبات قيد الانتظار */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>طلبات قيد الانتظار</p>
              <p className="text-3xl font-bold text-white mt-1">{pendingCount}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gold-muted)" }}
            >
              <Clock className="w-6 h-6" style={{ color: "var(--gold)" }} />
            </div>
          </div>
        </div>

        {/* تحتاج دفع */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>تحتاج دفع هذا الشهر</p>
              <p className="text-3xl font-bold text-white mt-1">{unpaidCount}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.65 0.22 25 / 15%)" }}
            >
              <CreditCard className="w-6 h-6" style={{ color: "oklch(0.65 0.22 25)" }} />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
