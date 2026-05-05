export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { Users, CheckCircle2, XCircle, CalendarDays, UserCircle2 } from "lucide-react";

// ==========================================
// تسميات أنماط الأيام بالعربية
// ==========================================
const dayPatternLabels: Record<string, string> = {
  SAT_MON_WED: "سبت / اثنين / أربعاء",  // النمط الأول
  SUN_TUE_THU: "أحد / ثلاثاء / خميس",   // النمط الثاني
};

// ==========================================
// صفحة Dashboard المدرب — Server Component
// ==========================================
export default async function CoachDashboard() {

  // جلب بيانات الجلسة والتحقق من الصلاحية
  const session = await getAppSession();
  if (!session || session.user.role !== "coach") redirect("/login");
  const coachId = session.user.profileId; // معرف المدرب في جدول coaches

  // الشهر والسنة الحاليان لحساب حالة الدفع ديناميكياً
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  // جلب السباحين والمجموعات بشكل متوازٍ
  const [
    { data: allSwimmers },  // كل سباحي المدرب النشطين
    { data: groups },        // المجموعات التدريبية مع أسماء السباحين
  ] = await Promise.all([

    // جلب معرفات السباحين النشطين لهذا المدرب
    supabaseAdmin
      .from("swimmers")
      .select("id")
      .eq("coach_id", coachId)
      .eq("status", "active"),

    // المجموعات التدريبية للمدرب مع بيانات السباحين (بدون payment_status القديم)
    supabaseAdmin
      .from("training_groups")
      .select(`
        id,
        label,
        day_pattern,
        time_slot,
        swimmers(id, name)
      `)
      // swimmers(id, name) → السباحون داخل هذه المجموعة
      .eq("coach_id", coachId)   // فقط مجموعات هذا المدرب
      .order("day_pattern")      // مرتبة حسب نمط الأيام
      .order("time_slot"),       // ثم حسب الفترة الزمنية
  ]);

  // جلب الدفعات المقبولة لهذا الشهر لسباحي المدرب
  const swimmerIds = allSwimmers?.map((s) => s.id) ?? [];
  const { data: approvedPayments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", swimmerIds)
        .eq("month", currentMonth)
        .eq("year",  currentYear)
        .eq("status", "approved")
    : { data: [] };

  // Set من معرفات المدفوعين هذا الشهر
  const paidThisMonthIds = new Set(approvedPayments?.map((p) => p.swimmer_id) ?? []);

  // حساب الإحصاءات من البيانات المجلوبة
  const totalSwimmers  = swimmerIds.length;                                              // إجمالي السباحين
  const paidSwimmers   = swimmerIds.filter((id) => paidThisMonthIds.has(id)).length;    // المدفوعون
  const unpaidSwimmers = totalSwimmers - paidSwimmers;                                   // غير المدفوعين

  // إضافة payment_status ديناميكي لكل سباح داخل كل مجموعة
  const groupsWithPayment = (groups ?? []).map((group) => ({
    ...group,
    swimmers: (group.swimmers ?? []).map((s: { id: string; name: string }) => ({
      ...s,
      // هل هذا السباح دفع هذا الشهر؟ نتحقق من الـ Set
      payment_status: paidThisMonthIds.has(s.id) ? "paid" : "unpaid",
    })),
  }));

  // تقسيم المجموعات إلى نمطين: سبت/اثنين/أربعاء و أحد/ثلاثاء/خميس
  const satMonWed = groupsWithPayment.filter((g) => g.day_pattern === "SAT_MON_WED");
  const sunTueThu = groupsWithPayment.filter((g) => g.day_pattern === "SUN_TUE_THU");

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">

      {/* ==========================================
          رأس الصفحة
          ========================================== */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          مرحباً، مدرب {session?.user.name}
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          ملخص مجموعاتك التدريبية لهذا الشهر
        </p>
      </div>

      {/* ==========================================
          بطاقات الإحصاءات
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* إجمالي السباحين */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>إجمالي سباحيّ</p>
              <p className="text-3xl font-bold text-white mt-1">{totalSwimmers ?? 0}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--cyan-muted)" }}
            >
              <Users className="w-6 h-6" style={{ color: "var(--cyan)" }} />
            </div>
          </div>
        </div>

        {/* المدفوعون */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>مدفوعون هذا الشهر</p>
              <p className="text-3xl font-bold text-white mt-1">{paidSwimmers ?? 0}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.65 0.18 145 / 15%)" }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: "oklch(0.72 0.2 145)" }} />
            </div>
          </div>
        </div>

        {/* غير المدفوعين */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>غير مدفوعين</p>
              <p className="text-3xl font-bold text-white mt-1">{unpaidSwimmers ?? 0}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.65 0.22 25 / 15%)" }}
            >
              <XCircle className="w-6 h-6" style={{ color: "oklch(0.65 0.22 25)" }} />
            </div>
          </div>
        </div>

      </div>

      {/* ==========================================
          رابط سريع لقائمة السباحين
          ========================================== */}
      <a
        href="/coach/swimmers"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
        style={{ background: "var(--cyan-muted)", color: "var(--cyan)", border: "1px solid var(--cyan)" }}
      >
        <Users className="w-4 h-4" />
        عرض قائمة السباحين الكاملة
      </a>

      {/* ==========================================
          قسم المجموعات التدريبية
          ========================================== */}
      <div>

        {/* عنوان القسم */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--cyan-muted)" }}
          >
            <CalendarDays className="w-5 h-5" style={{ color: "var(--cyan)" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">مجموعاتي التدريبية</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {groupsWithPayment.length} مجموعة — مقسّمة حسب نمط الأيام
            </p>
          </div>
        </div>

        {/* الحالة الفارغة — لو المدرب لا يملك أي مجموعات بعد */}
        {groupsWithPayment.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-white font-medium">لا توجد مجموعات بعد</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              سيضيف لك الأدمن مجموعاتك التدريبية قريباً
            </p>
          </div>
        )}

        {/* عرض المجموعات في نمطين جنباً إلى جنب */}
        {groupsWithPayment.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ==========================================
                نمط 1: سبت / اثنين / أربعاء
                ========================================== */}
            <div className="space-y-3">

              {/* رأس النمط */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "var(--cyan-muted)", border: "1px solid var(--cyan)" }}
              >
                <CalendarDays className="w-4 h-4" style={{ color: "var(--cyan)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--cyan)" }}>
                  {dayPatternLabels["SAT_MON_WED"]}
                </span>
                {/* عدد المجموعات في هذا النمط */}
                <span
                  className="mr-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
                >
                  {satMonWed.length} مجموعة
                </span>
              </div>

              {/* مجموعات هذا النمط */}
              {satMonWed.length === 0 ? (
                // حالة عدم وجود مجموعات في هذا النمط
                <div
                  className="rounded-xl p-4 text-center text-sm"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                >
                  لا توجد مجموعات لهذا النمط
                </div>
              ) : (
                satMonWed.map((group) => (
                  <GroupCard key={group.id} group={group} /> // بطاقة كل مجموعة
                ))
              )}
            </div>

            {/* ==========================================
                نمط 2: أحد / ثلاثاء / خميس
                ========================================== */}
            <div className="space-y-3">

              {/* رأس النمط */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "var(--gold-muted)", border: "1px solid var(--gold)" }}
              >
                <CalendarDays className="w-4 h-4" style={{ color: "var(--gold)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
                  {dayPatternLabels["SUN_TUE_THU"]}
                </span>
                {/* عدد المجموعات في هذا النمط */}
                <span
                  className="mr-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--gold)", color: "var(--gold-foreground)" }}
                >
                  {sunTueThu.length} مجموعة
                </span>
              </div>

              {/* مجموعات هذا النمط */}
              {sunTueThu.length === 0 ? (
                <div
                  className="rounded-xl p-4 text-center text-sm"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                >
                  لا توجد مجموعات لهذا النمط
                </div>
              ) : (
                sunTueThu.map((group) => (
                  <GroupCard key={group.id} group={group} /> // بطاقة كل مجموعة
                ))
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// مكوّن بطاقة المجموعة الواحدة
// ==========================================
function GroupCard({ group }: {
  group: {
    id: string;
    label: string;
    day_pattern: string;
    time_slot: string;
    swimmers: { id: string; name: string; payment_status: string }[];
  }
}) {

  // السباحون داخل هذه المجموعة (ممكن تكون مصفوفة فارغة)
  const swimmers = group.swimmers ?? [];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* رأس البطاقة — اسم المجموعة وعدد السباحين */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold text-white truncate">
          {group.label} {/* اسم المجموعة مثل: سبت/اثنين/أربعاء — 8:00 ص */}
        </p>
        {/* عدد السباحين */}
        <span
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full mr-2"
          style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
        >
          {swimmers.length} سباح
        </span>
      </div>

      {/* قائمة السباحين */}
      <div className="p-3">
        {swimmers.length === 0 ? (
          // حالة عدم وجود سباحين في هذه المجموعة
          <p className="text-xs text-center py-2" style={{ color: "var(--muted-foreground)" }}>
            لا يوجد سباحون في هذه المجموعة بعد
          </p>
        ) : (
          <div className="space-y-1.5">
            {swimmers.map((swimmer) => {
              // تحديد لون بادج الدفع حسب الحالة
              const isPaid = swimmer.payment_status === "paid";

              return (
                <div
                  key={swimmer.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg"
                  style={{ background: "var(--secondary)" }}
                >
                  {/* اسم السباح مع أيقونة */}
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    />
                    <span className="text-sm text-white truncate">{swimmer.name}</span>
                  </div>

                  {/* بادج حالة الدفع */}
                  <span
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: isPaid
                        ? "oklch(0.65 0.18 145 / 15%)"  // خلفية خضراء لو مدفوع
                        : "var(--gold-muted)",            // خلفية ذهبية لو لم يدفع
                      color: isPaid
                        ? "oklch(0.72 0.2 145)"           // نص أخضر
                        : "var(--gold)",                   // نص ذهبي
                    }}
                  >
                    {isPaid ? "✅" : "⚠️"} {/* أيقونة الحالة */}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
