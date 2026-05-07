"use client";

// استيراد useState لإدارة الحالة
import { useState } from "react";

// استيراد الأيقونات
import {
  Users,           // أيقونة تقرير السباحين
  GraduationCap,   // أيقونة تقرير المدربين
  Printer,         // أيقونة الطباعة
  Loader2,         // أيقونة التحميل
  FileText,        // أيقونة الملف
  X,               // أيقونة الإغلاق
  CheckCircle2,    // أيقونة النجاح
} from "lucide-react";

// استيراد مكوّن الزرار
import { Button } from "@/components/ui/button";

// ==========================================
// ترجمة المستويات للعربية
// ==========================================
const levelLabels: Record<string, string> = {
  beginner:     "مبتدئ",
  intermediate: "متوسط",
  advanced:     "متقدم",
};

// ترجمة حالات السباح للعربية
const statusLabels: Record<string, string> = {
  active:   "نشط",
  pending:  "قيد الانتظار",
  inactive: "غير نشط",
};

// أسماء الشهور بالعربية
const monthNames: Record<number, string> = {
  1: "يناير", 2: "فبراير", 3: "مارس",
  4: "أبريل", 5: "مايو",   6: "يونيو",
  7: "يوليو", 8: "أغسطس", 9: "سبتمبر",
  10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
};

// ==========================================
// أنواع البيانات للتقارير
// ==========================================
interface SwimmerReportItem {
  id: string;
  name: string;
  age: number;
  level: string;
  status: string;
  created_at: string;
  coach_name: string;
  coach_phone: string;
  group_label: string;
  group_day_pattern: string;
  parent_name: string;
  parent_phone: string;
  paid_last_month: boolean; // هل دفع الشهر الماضي؟
}

interface CoachReportItem {
  id: string;
  name: string;
  phone: string;
  swimmers_count: number;
  swimmers: {
    id: string;
    name: string;
    age: number;
    level: string;
    group_label: string;
  }[];
}

// ==========================================
// دالة توليد HTML تقرير السباحين للطباعة
// يعرض حالة دفع كل سباح عن الشهر الماضي
// ==========================================
function generateSwimmersHTML(
  swimmers: SwimmerReportItem[],
  lastMonth: number,
  lastYear: number,
): string {
  // اسم الشهر الماضي بالعربية
  const monthLabel = `${monthNames[lastMonth]} ${lastYear}`;

  // تاريخ إنشاء التقرير
  const printDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

  // عدد المدفوعين والمتأخرين
  const paidCount    = swimmers.filter((s) => s.paid_last_month).length;
  const notPaidCount = swimmers.filter((s) => s.status === "active" && !s.paid_last_month).length;

  const rows = swimmers.map((s, i) => {
    const paidCell = s.status !== "active"
      ? `<td style="text-align:center;color:#888">—</td>`
      : s.paid_last_month
        ? `<td style="text-align:center;color:#16a34a;font-weight:bold">✓ مدفوع</td>`
        : `<td style="text-align:center;color:#dc2626;font-weight:bold">✗ غير مدفوع</td>`;

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${s.name}</td>
        <td>${s.age} سنة</td>
        <td>${levelLabels[s.level] ?? s.level}</td>
        <td>${statusLabels[s.status] ?? s.status}</td>
        <td>${s.parent_name}</td>
        <td dir="ltr">${s.parent_phone}</td>
        <td>${s.coach_name}</td>
        <td>${s.group_label}</td>
        ${paidCell}
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير السباحين - ${monthLabel} - أكاديمية طنطا للسباحة</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', 'Tahoma', sans-serif;
      direction: rtl;
      color: #111;
      padding: 24px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0891b2;
    }
    .header h1 { font-size: 20px; color: #0891b2; margin-bottom: 4px; }
    .header .month-badge {
      display: inline-block;
      margin-top: 6px;
      background: #0891b2;
      color: white;
      padding: 3px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 12px;
      color: #555;
    }
    .summary {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12px;
    }
    .badge-blue  { background: #e0f2fe; color: #0891b2; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red   { background: #fee2e2; color: #dc2626; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #0891b2; color: white; }
    thead th {
      padding: 8px 6px;
      text-align: right;
      font-weight: bold;
      white-space: nowrap;
    }
    tbody tr:nth-child(even) { background: #f0f9ff; }
    tbody td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
    .footer {
      margin-top: 20px;
      text-align: center;
      color: #888;
      font-size: 11px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
    @media print {
      body { padding: 10px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>أكاديمية طنطا للسباحة 🏊</h1>
    <p>تقرير السباحين الشامل</p>
    <div class="month-badge">شهر ${monthLabel}</div>
  </div>

  <div class="meta">
    <span>تاريخ الإنشاء: <strong>${printDate}</strong></span>
  </div>

  <div class="summary">
    <span class="badge badge-blue">إجمالي السباحين: ${swimmers.length}</span>
    <span class="badge badge-green">مدفوع: ${paidCount}</span>
    <span class="badge badge-red">غير مدفوع: ${notPaidCount}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>اسم السباح</th>
        <th>العمر</th>
        <th>المستوى</th>
        <th>الحالة</th>
        <th>ولي الأمر</th>
        <th>هاتف ولي الأمر</th>
        <th>المدرب</th>
        <th>المجموعة</th>
        <th>دفع ${monthLabel}؟</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة نظام إدارة أكاديمية طنطا للسباحة</p>
  </div>
</body>
</html>`;
}

// ==========================================
// دالة توليد HTML تقرير المدربين للطباعة
// ==========================================
function generateCoachesHTML(
  coaches: CoachReportItem[],
  lastMonth: number,
  lastYear: number,
): string {
  // اسم الشهر الماضي بالعربية
  const monthLabel = `${monthNames[lastMonth]} ${lastYear}`;

  // تاريخ إنشاء التقرير
  const printDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

  const totalSwimmers = coaches.reduce((sum, c) => sum + c.swimmers_count, 0);

  const coachSections = coaches.map((coach, ci) => {
    const swimmerRows = coach.swimmers.map((s, si) => `
      <tr>
        <td>${si + 1}</td>
        <td>${s.name}</td>
        <td>${s.age} سنة</td>
        <td>${levelLabels[s.level] ?? s.level}</td>
        <td>${s.group_label}</td>
      </tr>
    `).join("");

    return `
      <div class="coach-card">
        <div class="coach-header">
          <div class="coach-info">
            <span class="coach-num">${ci + 1}</span>
            <div>
              <strong>${coach.name}</strong>
              ${coach.phone !== "—" ? `<span class="phone" dir="ltr"> | ${coach.phone}</span>` : ""}
            </div>
          </div>
          <span class="count-badge">${coach.swimmers_count} سباح</span>
        </div>
        ${coach.swimmers.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم السباح</th>
              <th>العمر</th>
              <th>المستوى</th>
              <th>المجموعة</th>
            </tr>
          </thead>
          <tbody>${swimmerRows}</tbody>
        </table>
        ` : `<p style="text-align:center;color:#888;padding:12px;font-size:12px">لا يوجد سباحون معينون لهذا المدرب</p>`}
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير المدربين - ${monthLabel} - أكاديمية طنطا للسباحة</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', 'Tahoma', sans-serif;
      direction: rtl;
      color: #111;
      padding: 24px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0891b2;
    }
    .header h1 { font-size: 20px; color: #0891b2; margin-bottom: 4px; }
    .header .month-badge {
      display: inline-block;
      margin-top: 6px;
      background: #0891b2;
      color: white;
      padding: 3px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 12px;
      color: #555;
    }
    .summary {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12px;
    }
    .badge-blue { background: #e0f2fe; color: #0891b2; }
    .coach-card {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .coach-header {
      background: #f0f9ff;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #bae6fd;
    }
    .coach-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: bold;
      color: #0c4a6e;
    }
    .coach-num {
      width: 26px;
      height: 26px;
      background: #0891b2;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .phone { color: #555; font-size: 12px; font-weight: normal; }
    .count-badge {
      background: #0891b2;
      color: white;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #e0f2fe; }
    thead th { padding: 7px 10px; text-align: right; color: #0c4a6e; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
    .footer {
      margin-top: 20px;
      text-align: center;
      color: #888;
      font-size: 11px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
    @media print {
      body { padding: 10px; }
      .coach-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>أكاديمية طنطا للسباحة 🏊</h1>
    <p>تقرير المدربين وأعداد السباحين</p>
    <div class="month-badge">شهر ${monthLabel}</div>
  </div>

  <div class="meta">
    <span>تاريخ الإنشاء: <strong>${printDate}</strong></span>
  </div>

  <div class="summary">
    <span class="badge badge-blue">${coaches.length} مدرب</span>
    <span class="badge badge-blue">${totalSwimmers} سباح نشط</span>
  </div>

  ${coachSections}

  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة نظام إدارة أكاديمية طنطا للسباحة</p>
  </div>
</body>
</html>`;
}

// ==========================================
// دالة فتح التقرير في نافذة جديدة وطباعته
// ==========================================
function printHTML(html: string) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("يرجى السماح بفتح نوافذ منبثقة في المتصفح");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function ReportsClient() {

  // حالة التحميل — "swimmers" | "coaches" | null
  const [loading, setLoading] = useState<"swimmers" | "coaches" | null>(null);

  // رسالة الخطأ
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // دالة إنشاء تقرير السباحين
  // ==========================================
  const handleSwimmersReport = async () => {
    setLoading("swimmers");
    setError(null);

    const res = await fetch("/api/admin/reports/swimmers");

    if (!res.ok) {
      setError("حدث خطأ أثناء جلب البيانات، يرجى المحاولة مجدداً");
      setLoading(null);
      return;
    }

    const { swimmers, lastMonth, lastYear } = await res.json();
    setLoading(null);

    // توليد HTML بتاريخ الشهر الماضي وفتح نافذة الطباعة
    const html = generateSwimmersHTML(swimmers, lastMonth, lastYear);
    printHTML(html);
  };

  // ==========================================
  // دالة إنشاء تقرير المدربين
  // ==========================================
  const handleCoachesReport = async () => {
    setLoading("coaches");
    setError(null);

    const res = await fetch("/api/admin/reports/coaches");

    if (!res.ok) {
      setError("حدث خطأ أثناء جلب البيانات، يرجى المحاولة مجدداً");
      setLoading(null);
      return;
    }

    const { coaches, lastMonth, lastYear } = await res.json();
    setLoading(null);

    // توليد HTML بتاريخ الشهر الماضي وفتح نافذة الطباعة
    const html = generateCoachesHTML(coaches, lastMonth, lastYear);
    printHTML(html);
  };

  return (
    <div className="max-w-2xl">

      {/* ==========================================
          سؤال اختيار نوع التقرير
          ========================================== */}
      <div
        className="rounded-2xl p-6 mb-6 border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* أيقونة وعنوان */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--cyan-muted)" }}
          >
            <FileText className="w-5 h-5" style={{ color: "var(--cyan)" }} />
          </div>
          <h2 className="text-lg font-semibold text-white">أي تقرير تريد إنشاؤه؟</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          سيُنشئ التقرير عن <strong className="text-white">الشهر الماضي</strong> ويُفتح في نافذة جديدة جاهزاً للطباعة
        </p>
      </div>

      {/* ==========================================
          بطاقتا الاختيار
          ========================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* ===== بطاقة تقرير السباحين ===== */}
        <div
          className="rounded-2xl border p-6 flex flex-col gap-4 transition-all hover:border-cyan-500/40"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {/* أيقونة */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--cyan-muted)" }}
          >
            <Users className="w-6 h-6" style={{ color: "var(--cyan)" }} />
          </div>

          {/* نص */}
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              تقرير السباحين الشامل
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              جميع السباحين مع بيانات ولي الأمر والمدرب والمجموعة وحالة دفع الشهر الماضي
            </p>
          </div>

          {/* زرار الإنشاء */}
          <Button
            onClick={handleSwimmersReport}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 font-medium h-10 mt-auto"
            style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
          >
            {loading === "swimmers" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                إنشاء التقرير
              </>
            )}
          </Button>
        </div>

        {/* ===== بطاقة تقرير المدربين ===== */}
        <div
          className="rounded-2xl border p-6 flex flex-col gap-4 transition-all hover:border-cyan-500/40"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {/* أيقونة */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gold-muted)" }}
          >
            <GraduationCap className="w-6 h-6" style={{ color: "var(--gold)" }} />
          </div>

          {/* نص */}
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              تقرير المدربين والسباحين
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              كل مدرب مع أعداد وأسماء السباحين المعينين له ومجموعاته
            </p>
          </div>

          {/* زرار الإنشاء */}
          <Button
            onClick={handleCoachesReport}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 font-medium h-10 mt-auto"
            style={{
              background: "var(--gold-muted)",
              color: "var(--gold)",
              border: "1px solid oklch(0.85 0.16 85 / 40%)",
            }}
          >
            {loading === "coaches" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                إنشاء التقرير
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ==========================================
          رسالة الخطأ
          ========================================== */}
      {error && (
        <div
          className="mt-4 rounded-xl p-4 flex items-center gap-3 text-sm"
          style={{
            background: "oklch(0.65 0.22 25 / 15%)",
            border: "1px solid oklch(0.65 0.22 25 / 30%)",
            color: "oklch(0.65 0.22 25)",
          }}
        >
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ==========================================
          ملاحظة المتصفح
          ========================================== */}
      <div
        className="mt-6 rounded-xl p-4 flex items-start gap-3 text-sm"
        style={{
          background: "var(--secondary)",
          border: "1px solid var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
        <p>
          سيُفتح التقرير في نافذة جديدة جاهزاً للطباعة. إذا لم تظهر النافذة،
          تأكد من السماح بالنوافذ المنبثقة لهذا الموقع في إعدادات المتصفح.
        </p>
      </div>
    </div>
  );
}
