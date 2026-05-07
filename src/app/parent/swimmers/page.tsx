export const dynamic = "force-dynamic";
import { getAppSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { UserPlus, Clock, CheckCircle2, XCircle, Users, GraduationCap, Phone } from "lucide-react";
import { simulatedNow } from "@/lib/now";
import Link from "next/link";
import { levelLabels } from "@/lib/types"; // ثابت ترجمة المستويات المشترك

// ==========================================
// ألوان وأيقونات حالات السباح
// ==========================================
const statusConfig = {
  pending: {
    label: "قيد الانتظار",
    icon: Clock,
    color: "var(--gold)",
    bg: "var(--gold-muted)",
    border: "var(--gold)",
  },
  active: {
    label: "مقبول ونشط",
    icon: CheckCircle2,
    color: "oklch(0.72 0.2 145)",
    bg: "oklch(0.65 0.18 145 / 15%)",
    border: "oklch(0.65 0.18 145 / 40%)",
  },
  inactive: {
    label: "غير نشط",
    icon: XCircle,
    color: "var(--muted-foreground)",
    bg: "oklch(0.18 0 0)",
    border: "var(--border)",
  },
};

// ترجمة نمط الأيام
const dayPatternLabel: Record<string, string> = {
  SAT_MON_WED: "سبت / اثنين / أربعاء",
  SUN_TUE_THU: "أحد / ثلاثاء / خميس",
};


export default async function ParentSwimmersPage() {
  const session = await getAppSession();
  if (!session || session.user.role !== "parent") redirect("/login");

  // الشهر والسنة الحاليان لحساب حالة الدفع ديناميكياً
  const now          = simulatedNow();
  const currentMonth = now.getMonth() + 1; // getMonth() يبدأ من 0
  const currentYear  = now.getFullYear();

  // جلب السباحين مع بيانات المدرب والمجموعة
  const { data: swimmers } = await supabaseAdmin
    .from("swimmers")
    .select(`
      id, name, age, level, status, created_at,
      coaches ( name, phone ),
      training_groups ( label, day_pattern, time_slot ),
      enrollment_requests ( status, notes, created_at )
    `)
    .eq("parent_id", session.user.profileId)
    .order("created_at", { ascending: false });

  // جلب الدفعات المقبولة لهذا الشهر فقط (لحساب حالة الدفع ديناميكياً)
  const swimmerIds = swimmers?.map((s) => s.id) ?? [];
  const { data: approvedPayments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", swimmerIds)      // بس سباحي ولي الأمر ده
        .eq("month", currentMonth)          // الشهر الحالي فقط
        .eq("year",  currentYear)           // السنة الحالية فقط
        .eq("status", "approved")           // المقبولة فقط (مش pending أو rejected)
    : { data: [] };

  // Set من معرفات السباحين الذين دفعوا هذا الشهر — للبحث السريع O(1)
  const paidThisMonthIds = new Set(approvedPayments?.map((p) => p.swimmer_id) ?? []);

  return (
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">أبنائي</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {swimmers?.length ?? 0} سباح مسجل
          </p>
        </div>
        {/* زر إضافة سباح جديد */}
        <Link
          href="/parent/swimmers/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all glow-cyan"
          style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
        >
          <UserPlus className="w-4 h-4" />
          تسجيل سباح جديد
        </Link>
      </div>

      {/* ==========================================
          حالة فارغة - لا يوجد سباحون بعد
          ========================================== */}
      {(!swimmers || swimmers.length === 0) && (
        <div
          className="rounded-xl p-12 text-center border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-white font-medium mb-1">لا يوجد سباحون مسجلون بعد</p>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            اضغط على "تسجيل سباح جديد" لإضافة ابنك
          </p>
          <Link
            href="/parent/swimmers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
          >
            <UserPlus className="w-4 h-4" />
            تسجيل سباح جديد
          </Link>
        </div>
      )}

      {/* ==========================================
          قائمة السباحين
          ========================================== */}
      <div className="space-y-4">
        {swimmers?.map((swimmer: any) => {
          const config = statusConfig[swimmer.status as keyof typeof statusConfig];
          const StatusIcon = config.icon;
          const enrollmentRequest = swimmer.enrollment_requests?.[0];

          return (
            <div
              key={swimmer.id}
              className="rounded-xl border p-5 transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">

                {/* معلومات السباح */}
                <div className="flex items-start gap-4">
                  {/* أيقونة الحالة */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: config.bg }}
                  >
                    <StatusIcon className="w-5 h-5" style={{ color: config.color }} />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white">{swimmer.name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {swimmer.age} سنة
                      </span>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>•</span>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {levelLabels[swimmer.level]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* شارة الحالة */}
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    color: config.color,
                    background: config.bg,
                    borderColor: config.border,
                  }}
                >
                  {config.label}
                </span>
              </div>

              {/* ==========================================
                  تفاصيل إضافية حسب الحالة
                  ========================================== */}

              {/* السباح مقبول: عرض المدرب ورقمه والمجموعة */}
              {swimmer.status === "active" && swimmer.coaches && (
                <div
                  className="mt-4 pt-4 border-t grid grid-cols-2 gap-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* عمود المدرب — الاسم + رقم الهاتف */}
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--cyan)" }} />
                    <div>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>المدرب</p>
                      <p className="text-sm text-white font-medium">{swimmer.coaches.name}</p>

                      {/* رقم المدرب — بيظهر بس لو موجود */}
                      {swimmer.coaches.phone && (
                        <a
                          href={`tel:${swimmer.coaches.phone}`}
                          className="flex items-center gap-1 mt-1 text-xs transition-opacity hover:opacity-80"
                          style={{ color: "var(--cyan)" }}
                          title="اتصل بالمدرب"
                        >
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="font-mono" style={{ direction: "ltr" }}>
                            {swimmer.coaches.phone}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* عمود المجموعة */}
                  {swimmer.training_groups && (
                    <div>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>المجموعة</p>
                      <p className="text-sm text-white font-medium">{swimmer.training_groups.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {dayPatternLabel[swimmer.training_groups.day_pattern]}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* الطلب مرفوض: عرض سبب الرفض */}
              {enrollmentRequest?.status === "rejected" && enrollmentRequest.notes && (
                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--destructive)" }}>
                    سبب الرفض:
                  </p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {enrollmentRequest.notes}
                  </p>
                </div>
              )}

              {/* الطلب قيد الانتظار: رسالة توضيحية */}
              {swimmer.status === "pending" && (
                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="text-xs" style={{ color: "var(--gold)" }}>
                    ⏳ طلبك قيد المراجعة من قبل الإدارة، سنُشعرك عند القبول
                  </p>
                </div>
              )}

              {/* حالة الدفع الديناميكية للسباحين النشطين (تُحسب من جدول payments) */}
              {swimmer.status === "active" && (() => {
                // التحقق من الـ Set — هل دفع هذا السباح هذا الشهر؟
                const paidThisMonth = paidThisMonthIds.has(swimmer.id);
                return (
                  <div
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        حالة الدفع هذا الشهر
                      </p>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={
                          paidThisMonth
                            ? { color: "oklch(0.72 0.2 145)", background: "oklch(0.65 0.18 145 / 15%)" }
                            : { color: "var(--gold)", background: "var(--gold-muted)" }
                        }
                      >
                        {paidThisMonth ? "✓ مدفوع" : "⚠ غير مدفوع"}
                      </span>
                    </div>

                    {/* رسالة توجيه لدفع الاشتراك لو لسه مش مدفوع */}
                    {!paidThisMonth && (
                      <p className="text-xs mt-2" style={{ color: "var(--gold)" }}>
                        💰 يرجى التوجه للخزنة لسداد اشتراك هذا الشهر ورفع الإيصال
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
