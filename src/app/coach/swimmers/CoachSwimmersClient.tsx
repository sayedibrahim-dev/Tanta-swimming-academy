// تحديد إن المكوّن ده Client Component (بيشتغل في المتصفح)
"use client";

// استيراد useState لإدارة البحث والفلترة
import { useState } from "react";

// استيراد الأيقونات المستخدمة في الصفحة
import {
  Search,        // أيقونة البحث
  Users,         // أيقونة السباحين
  CheckCircle2,  // أيقونة المدفوعين
  AlertCircle,   // أيقونة غير المدفوعين
  Phone,         // أيقونة التليفون
  User,          // أيقونة ولي الأمر
  GraduationCap, // أيقونة المجموعة
} from "lucide-react";

// استيراد نوع بيانات السباح من صفحة السيرفر
import type { CoachSwimmerItem } from "./page";

// استيراد ثابت ترجمة المستويات المشترك
import { levelLabels } from "@/lib/types";

// ==========================================
// الـ Props اللي بيستقبلها المكوّن
// ==========================================
interface CoachSwimmersClientProps {
  swimmers: CoachSwimmerItem[]; // قائمة السباحين من السيرفر
}

// ==========================================
// ألوان كل مستوى (خلفية + نص)
// ==========================================
const levelColors = {
  beginner: { bg: "var(--cyan-muted)", text: "var(--cyan)" },         // سيان للمبتدئ
  intermediate: { bg: "var(--gold-muted)", text: "var(--gold)" },     // ذهبي للمتوسط
  advanced: {
    bg: "oklch(0.65 0.22 25 / 15%)",  // أحمر خفيف للمتقدم
    text: "oklch(0.65 0.22 25)",       // أحمر للنص
  },
} as const;

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function CoachSwimmersClient({ swimmers }: CoachSwimmersClientProps) {

  // نص البحث اللي بيكتبه المدرب
  const [searchQuery, setSearchQuery] = useState("");

  // فلتر حالة الدفع: "all" أو "paid" أو "unpaid"
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");

  // ==========================================
  // حساب الإحصائيات من القائمة الكاملة
  // ==========================================
  const totalSwimmers = swimmers.length;                                        // إجمالي السباحين
  const paidCount = swimmers.filter((s) => s.payment_status === "paid").length; // عدد المدفوعين
  const unpaidCount = totalSwimmers - paidCount;                                // عدد غير المدفوعين

  // ==========================================
  // تطبيق الفلترة والبحث على القائمة
  // ==========================================
  const filtered = swimmers.filter((s) => {

    // فلتر البحث بالاسم — يبحث جوّا الاسم بغض النظر عن الحروف الكبيرة والصغيرة
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // فلتر حالة الدفع — "all" يعرض الكل
    const matchesPayment =
      paymentFilter === "all" || s.payment_status === paymentFilter;

    // السباح يظهر بس لو بيطابق البحث والفلتر معاً
    return matchesSearch && matchesPayment;
  });

  // ==========================================
  // الحالة الفارغة — لو المدرب مالوش سباحين خالص
  // ==========================================
  if (totalSwimmers === 0) {
    return (
      // بطاقة مركزية بتظهر لما القائمة فاضية
      <div
        className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* أيقونة كبيرة بخلفية سيان */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cyan-muted)" }}
        >
          <Users className="w-8 h-8" style={{ color: "var(--cyan)" }} />
        </div>

        {/* نص الحالة الفارغة */}
        <div>
          <p className="text-lg font-semibold text-white">لا يوجد سباحون بعد</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            سيظهر هنا السباحون المعيّنون لك بعد قبول طلباتهم
          </p>
        </div>
      </div>
    );
  }

  return (
    // الحاوية الرئيسية للمحتوى
    <div className="space-y-6">

      {/* ==========================================
          بطاقات الإحصاءات — 3 بطاقات في صف
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* بطاقة إجمالي السباحين */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* أيقونة سيان */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--cyan-muted)" }}
          >
            <Users className="w-5 h-5" style={{ color: "var(--cyan)" }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalSwimmers}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>إجمالي السباحين</p>
          </div>
        </div>

        {/* بطاقة المدفوعين */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* أيقونة خضراء */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.65 0.18 145 / 15%)" }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: "oklch(0.72 0.2 145)" }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{paidCount}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>مدفوع هذا الشهر</p>
          </div>
        </div>

        {/* بطاقة غير المدفوعين */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* أيقونة ذهبية للتحذير */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--gold-muted)" }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{unpaidCount}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>لم يدفع بعد</p>
          </div>
        </div>
      </div>

      {/* ==========================================
          شريط البحث والفلترة
          ========================================== */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* حقل البحث بالاسم */}
        <div className="relative flex-1">
          {/* أيقونة البحث داخل الحقل */}
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            type="text"
            placeholder="ابحث باسم السباح..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // تحديث نص البحث عند الكتابة
            className="w-full h-10 rounded-lg pr-9 pl-3 text-sm outline-none text-white"
            style={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        {/* أزرار فلتر حالة الدفع */}
        <div
          className="flex rounded-lg overflow-hidden flex-shrink-0"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* زرار "الكل" */}
          <button
            onClick={() => setPaymentFilter("all")} // عرض كل السباحين
            className="px-4 h-10 text-sm font-medium transition-colors"
            style={{
              background: paymentFilter === "all" ? "var(--cyan-muted)" : "var(--secondary)",
              color: paymentFilter === "all" ? "var(--cyan)" : "var(--muted-foreground)",
            }}
          >
            الكل
          </button>

          {/* زرار "مدفوع" */}
          <button
            onClick={() => setPaymentFilter("paid")} // عرض المدفوعين فقط
            className="px-4 h-10 text-sm font-medium transition-colors"
            style={{
              background: paymentFilter === "paid"
                ? "oklch(0.65 0.18 145 / 15%)"
                : "var(--secondary)",
              color: paymentFilter === "paid"
                ? "oklch(0.72 0.2 145)"
                : "var(--muted-foreground)",
              borderLeft: "1px solid var(--border)", // فاصل بين الأزرار
            }}
          >
            مدفوع ✅
          </button>

          {/* زرار "لم يدفع" */}
          <button
            onClick={() => setPaymentFilter("unpaid")} // عرض غير المدفوعين فقط
            className="px-4 h-10 text-sm font-medium transition-colors"
            style={{
              background: paymentFilter === "unpaid"
                ? "var(--gold-muted)"
                : "var(--secondary)",
              color: paymentFilter === "unpaid"
                ? "var(--gold)"
                : "var(--muted-foreground)",
              borderLeft: "1px solid var(--border)", // فاصل بين الأزرار
            }}
          >
            لم يدفع ⚠️
          </button>
        </div>
      </div>

      {/* ==========================================
          نتيجة الفلترة — عدد النتائج الظاهرة
          ========================================== */}
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {/* عرض عدد النتائج بعد الفلترة */}
        يُعرض {filtered.length} من {totalSwimmers} سباح
      </p>

      {/* ==========================================
          حالة عدم وجود نتائج للبحث
          ========================================== */}
      {filtered.length === 0 && (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Search className="w-8 h-8" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-white font-medium">لا توجد نتائج</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            جرّب تغيير الفلتر أو البحث بكلمة مختلفة
          </p>
        </div>
      )}

      {/* ==========================================
          شبكة بطاقات السباحين
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* تكرار على كل سباح وعرض بطاقته */}
        {filtered.map((swimmer) => {

          // ألوان المستوى الخاصة بهذا السباح
          const colors = levelColors[swimmer.level];

          // تحديد لون ونص بادج حالة الدفع
          const isPaid = swimmer.payment_status === "paid"; // هل مدفوع؟

          return (
            // بطاقة السباح الواحد
            <div
              key={swimmer.id} // مفتاح فريد لكل عنصر في القائمة (مطلوب من React)
              className="rounded-2xl p-5"
              style={{
                background: "var(--card)",        // خلفية البطاقة الداكنة
                border: "1px solid var(--border)", // حد البطاقة
              }}
            >
              {/* ==========================================
                  رأس البطاقة — الاسم + بادجات المستوى والدفع
                  ========================================== */}
              <div className="flex items-start justify-between gap-2 mb-4">

                {/* الاسم + بادج المستوى */}
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white truncate">
                    {swimmer.name} {/* اسم السباح */}
                  </h3>

                  {/* بادج المستوى بلون ديناميكي */}
                  <span
                    className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {levelLabels[swimmer.level]} {/* الترجمة العربية للمستوى */}
                  </span>
                </div>

                {/* بادج حالة الدفع — مدفوع أو غير مدفوع */}
                <span
                  className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: isPaid
                      ? "oklch(0.65 0.18 145 / 15%)" // خلفية خضراء لو مدفوع
                      : "var(--gold-muted)",           // خلفية ذهبية لو غير مدفوع
                    color: isPaid
                      ? "oklch(0.72 0.2 145)"          // نص أخضر لو مدفوع
                      : "var(--gold)",                  // نص ذهبي لو غير مدفوع
                  }}
                >
                  {isPaid ? "✅ مدفوع" : "⚠️ لم يدفع"} {/* نص البادج حسب الحالة */}
                </span>
              </div>

              {/* ==========================================
                  تفاصيل السباح — عمر + مجموعة + ولي أمر
                  ========================================== */}
              <div className="space-y-2.5">

                {/* العمر والمجموعة في صف واحد */}
                <div className="flex items-center gap-4">

                  {/* عمر السباح */}
                  <span
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {swimmer.age} سنة {/* عمر السباح */}
                  </span>

                  {/* اسم المجموعة — بيظهر بس لو موجود */}
                  {swimmer.group && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                      <span
                        className="text-sm truncate"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {swimmer.group.label} {/* اسم المجموعة التدريبية */}
                      </span>
                    </div>
                  )}
                </div>

                {/* خط فاصل بين التفاصيل */}
                <div
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                />

                {/* بيانات ولي الأمر */}
                {swimmer.parent && (
                  <div className="space-y-1.5">

                    {/* اسم ولي الأمر */}
                    <div className="flex items-center gap-1.5">
                      <User
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        ولي الأمر:
                      </span>
                      <span className="text-sm text-white font-medium truncate">
                        {swimmer.parent.name} {/* اسم ولي الأمر */}
                      </span>
                    </div>

                    {/* رقم تليفون ولي الأمر — بيظهر بس لو موجود */}
                    {swimmer.parent.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        {/* direction: ltr عشان الأرقام تتعرض من اليسار لليمين */}
                        <span
                          className="text-sm font-mono"
                          style={{
                            color: "var(--muted-foreground)",
                            direction: "ltr",
                          }}
                        >
                          {swimmer.parent.phone} {/* رقم التليفون */}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
