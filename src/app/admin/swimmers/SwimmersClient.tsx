// تحديد إن المكوّن ده Client Component (بيشتغل في المتصفح)
"use client";

// استيراد useState لإدارة الحالة التفاعلية
import { useState } from "react";

// استيراد الأيقونات
import {
  Search,         // أيقونة البحث
  Users,          // أيقونة السباحين
  CheckCircle2,   // أيقونة المدفوعين
  AlertCircle,    // أيقونة غير المدفوعين
  Phone,          // أيقونة التليفون
  User,           // أيقونة ولي الأمر
  GraduationCap,  // أيقونة المجموعة
  RefreshCw,      // أيقونة إعادة التعيين
  X,              // أيقونة إغلاق المودال
  Loader2,        // أيقونة التحميل
  ChevronDown,    // أيقونة القائمة المنسدلة
} from "lucide-react";

// استيراد مكوّن الزرار من shadcn/ui
import { Button } from "@/components/ui/button";

// استيراد نوع السباح من صفحة السيرفر
import type { SwimmerItem } from "./page";

// استيراد الأنواع والثوابت المشتركة
import type { CoachOption, GroupOption } from "@/lib/types";
import { levelLabels } from "@/lib/types";

// ==========================================
// الـ Props اللي بيستقبلها المكوّن
// ==========================================
interface SwimmersClientProps {
  initialSwimmers: SwimmerItem[]; // السباحون النشطون من السيرفر
  coaches: CoachOption[];          // قائمة المدربين لإعادة التعيين
  groups: GroupOption[];            // قائمة المجموعات لإعادة التعيين
}

// ==========================================
// ألوان كل مستوى (خلفية + نص)
// ==========================================
const levelColors = {
  beginner:     { bg: "var(--cyan-muted)",         text: "var(--cyan)"           },
  intermediate: { bg: "var(--gold-muted)",         text: "var(--gold)"           },
  advanced:     { bg: "oklch(0.65 0.22 25 / 15%)", text: "oklch(0.65 0.22 25)"  },
} as const;

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function SwimmersClient({
  initialSwimmers,
  coaches,
  groups,
}: SwimmersClientProps) {

  // قائمة السباحين — تتحدث بعد كل عملية إعادة تعيين
  const [swimmers, setSwimmers] = useState<SwimmerItem[]>(initialSwimmers);

  // نص البحث
  const [searchQuery, setSearchQuery] = useState("");

  // فلتر حالة الدفع
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");

  // فلتر المدرب (المعرف أو "all")
  const [coachFilter, setCoachFilter] = useState<string>("all");

  // السباح الذي فُتح له مودال إعادة التعيين
  const [reassignSwimmer, setReassignSwimmer] = useState<SwimmerItem | null>(null);

  // المدرب المختار في مودال إعادة التعيين
  const [selectedCoach, setSelectedCoach] = useState<string>("");

  // المجموعة المختارة في مودال إعادة التعيين
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  // حالة التحميل أثناء إرسال طلب إعادة التعيين
  const [isSubmitting, setIsSubmitting] = useState(false);

  // رسالة الخطأ في المودال
  const [modalError, setModalError] = useState<string | null>(null);

  // ==========================================
  // حساب الإحصائيات
  // ==========================================
  const totalSwimmers = swimmers.length;
  const paidCount   = swimmers.filter((s) => s.payment_status === "paid").length;
  const unpaidCount = totalSwimmers - paidCount;

  // ==========================================
  // فلترة السباحون المجموعات المتاحة حسب المدرب المختار في المودال
  // ==========================================
  const availableGroups = groups.filter(
    (g) => g.coach_id === selectedCoach // بس المجموعات التابعة للمدرب المختار
  );

  // ==========================================
  // تطبيق جميع الفلاتر والبحث معاً
  // ==========================================
  const filtered = swimmers.filter((s) => {
    const matchesSearch  = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === "all" || s.payment_status === paymentFilter;
    const matchesCoach   = coachFilter === "all" || s.coach_id === coachFilter;
    return matchesSearch && matchesPayment && matchesCoach;
  });

  // ==========================================
  // فتح مودال إعادة التعيين لسباح معين
  // ==========================================
  function openReassign(swimmer: SwimmerItem) {
    setReassignSwimmer(swimmer);               // تخزين السباح المحدد
    setSelectedCoach(swimmer.coach_id ?? "");  // ملء المدرب الحالي كقيمة افتراضية
    setSelectedGroup(swimmer.group_id ?? "");  // ملء المجموعة الحالية كقيمة افتراضية
    setModalError(null);                       // مسح أي خطأ سابق
  }

  // ==========================================
  // إغلاق المودال وتنظيف الحالة
  // ==========================================
  function closeReassign() {
    setReassignSwimmer(null);  // إخفاء المودال
    setSelectedCoach("");       // مسح المدرب المختار
    setSelectedGroup("");       // مسح المجموعة المختارة
    setModalError(null);        // مسح الخطأ
  }

  // ==========================================
  // تنفيذ إعادة التعيين — يرسل PATCH للـ API
  // ==========================================
  async function handleReassign() {
    if (!reassignSwimmer) return;

    // التحقق من اختيار مدرب ومجموعة
    if (!selectedCoach || !selectedGroup) {
      setModalError("يرجى اختيار مدرب ومجموعة");
      return;
    }

    setIsSubmitting(true); // بدء التحميل
    setModalError(null);   // مسح الخطأ

    // إرسال طلب تحديث للـ API
    const res = await fetch(`/api/admin/swimmers/${reassignSwimmer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coach_id: selectedCoach, // المدرب الجديد
        group_id: selectedGroup, // المجموعة الجديدة
      }),
    });

    setIsSubmitting(false); // إنهاء التحميل

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setModalError(err.error ?? "حدث خطأ، يرجى المحاولة مرة أخرى");
      return;
    }

    // تحديث قائمة السباحين في الواجهة بدون reload (optimistic update)
    const newCoach = coaches.find((c) => c.id === selectedCoach) ?? null;
    const newGroup = groups.find((g)  => g.id === selectedGroup) ?? null;

    setSwimmers((prev) =>
      prev.map((s) =>
        s.id === reassignSwimmer.id
          ? {
              ...s,
              coach_id: selectedCoach,
              group_id: selectedGroup,
              coach: newCoach ? { id: newCoach.id, name: newCoach.name } : null,
              group: newGroup
                ? { id: newGroup.id, label: newGroup.label, coach_id: newGroup.coach_id }
                : null,
            }
          : s
      )
    );

    closeReassign(); // إغلاق المودال بعد النجاح
  }

  // ==========================================
  // الحالة الفارغة — لا يوجد سباحون نشطون
  // ==========================================
  if (totalSwimmers === 0) {
    return (
      <div
        className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cyan-muted)" }}
        >
          <Users className="w-8 h-8" style={{ color: "var(--cyan)" }} />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">لا يوجد سباحون نشطون</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            اقبل طلبات الالتحاق المعلقة لتظهر هنا
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ==========================================
          بطاقات الإحصاءات
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* إجمالي السباحين */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
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

        {/* المدفوعون هذا الشهر */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
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

        {/* لم يدفعوا بعد */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
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
          شريط البحث والفلاتر
          ========================================== */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">

        {/* حقل البحث بالاسم */}
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            type="text"
            placeholder="ابحث باسم السباح..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // تحديث نص البحث
            className="w-full h-10 rounded-lg pr-9 pl-3 text-sm outline-none text-white"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          />
        </div>

        {/* فلتر المدرب */}
        <div className="relative">
          <ChevronDown
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)} // تغيير فلتر المدرب
            className="h-10 rounded-lg pr-3 pl-8 text-sm outline-none text-white appearance-none cursor-pointer"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          >
            <option value="all">جميع المدربين</option>
            {coaches.map((c) => (
              // خيار لكل مدرب
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* أزرار فلتر حالة الدفع */}
        <div
          className="flex rounded-lg overflow-hidden flex-shrink-0"
          style={{ border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setPaymentFilter("all")} // عرض الكل
            className="px-4 h-10 text-sm font-medium transition-colors"
            style={{
              background: paymentFilter === "all" ? "var(--cyan-muted)" : "var(--secondary)",
              color:      paymentFilter === "all" ? "var(--cyan)"       : "var(--muted-foreground)",
            }}
          >الكل</button>
          <button
            onClick={() => setPaymentFilter("paid")} // عرض المدفوعين فقط
            className="px-4 h-10 text-sm font-medium transition-colors"
            style={{
              background: paymentFilter === "paid" ? "oklch(0.65 0.18 145 / 15%)" : "var(--secondary)",
              color:      paymentFilter === "paid" ? "oklch(0.72 0.2 145)"          : "var(--muted-foreground)",
              borderRight: "1px solid var(--border)",
              borderLeft:  "1px solid var(--border)",
            }}
          >مدفوع ✅</button>
          <button
            onClick={() => setPaymentFilter("unpaid")} // عرض غير المدفوعين فقط
            className="px-4 h-10 text-sm font-medium transition-colors"
            style={{
              background: paymentFilter === "unpaid" ? "var(--gold-muted)" : "var(--secondary)",
              color:      paymentFilter === "unpaid" ? "var(--gold)"       : "var(--muted-foreground)",
            }}
          >لم يدفع ⚠️</button>
        </div>
      </div>

      {/* عدد النتائج بعد الفلترة */}
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        يُعرض {filtered.length} من {totalSwimmers} سباح
      </p>

      {/* حالة عدم وجود نتائج */}
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
        {filtered.map((swimmer) => {

          const colors = levelColors[swimmer.level]; // ألوان مستوى هذا السباح
          const isPaid  = swimmer.payment_status === "paid"; // هل مدفوع؟

          return (
            <div
              key={swimmer.id}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {/* رأس البطاقة — الاسم + بادجات */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white truncate">
                    {swimmer.name}
                  </h3>
                  {/* بادج المستوى */}
                  <span
                    className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {levelLabels[swimmer.level]}
                  </span>
                </div>

                {/* بادج حالة الدفع */}
                <span
                  className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: isPaid ? "oklch(0.65 0.18 145 / 15%)" : "var(--gold-muted)",
                    color:      isPaid ? "oklch(0.72 0.2 145)"          : "var(--gold)",
                  }}
                >
                  {isPaid ? "✅ مدفوع" : "⚠️ لم يدفع"}
                </span>
              </div>

              {/* تفاصيل السباح */}
              <div className="space-y-2 text-sm" style={{ color: "var(--muted-foreground)" }}>

                {/* العمر */}
                <p>{swimmer.age} سنة</p>

                {/* المدرب */}
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {swimmer.coach?.name ?? (
                      // لو لا يوجد مدرب معين
                      <span style={{ color: "var(--destructive)" }}>غير معين</span>
                    )}
                  </span>
                </div>

                {/* المجموعة */}
                {swimmer.group && (
                  <p className="text-xs truncate">
                    المجموعة: {swimmer.group.label}
                  </p>
                )}

                {/* خط فاصل */}
                <div className="border-t" style={{ borderColor: "var(--border)" }} />

                {/* بيانات ولي الأمر */}
                {swimmer.parent && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-white font-medium truncate">
                        {swimmer.parent.name}
                      </span>
                    </div>
                    {swimmer.parent.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-mono text-xs" style={{ direction: "ltr" }}>
                          {swimmer.parent.phone}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* زر إعادة التعيين */}
              <button
                onClick={() => openReassign(swimmer)} // فتح المودال لهذا السباح
                className="w-full mt-auto flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{ background: "var(--cyan-muted)", color: "var(--cyan)" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                إعادة التعيين
              </button>
            </div>
          );
        })}
      </div>

      {/* ==========================================
          مودال إعادة التعيين
          ========================================== */}
      {reassignSwimmer && (
        // خلفية شفافة داكنة خلف المودال
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={closeReassign} // إغلاق عند الضغط على الخلفية
        >
          {/* صندوق المودال — يمنع إغلاق المودال عند الضغط داخله */}
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()} // منع إغلاق المودال عند الضغط داخله
          >
            {/* رأس المودال */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">إعادة تعيين سباح</h2>
              <button
                onClick={closeReassign} // إغلاق المودال
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* اسم السباح */}
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              تعيين مدرب ومجموعة جديدة لـ
              <span className="text-white font-medium mx-1">{reassignSwimmer.name}</span>
            </p>

            {/* اختيار المدرب */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">المدرب</label>
              <div className="relative">
                <ChevronDown
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <select
                  value={selectedCoach}
                  onChange={(e) => {
                    setSelectedCoach(e.target.value); // تحديث المدرب المختار
                    setSelectedGroup("");              // إعادة ضبط المجموعة عند تغيير المدرب
                  }}
                  className="w-full h-11 rounded-lg pr-3 pl-8 text-sm outline-none text-white appearance-none cursor-pointer"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                >
                  <option value="">— اختر مدرباً —</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* اختيار المجموعة — بتظهر بس بعد اختيار المدرب */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">المجموعة التدريبية</label>
              <div className="relative">
                <ChevronDown
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)} // تحديث المجموعة المختارة
                  disabled={!selectedCoach} // معطلة لو لم يختار مدرباً بعد
                  className="w-full h-11 rounded-lg pr-3 pl-8 text-sm outline-none text-white appearance-none cursor-pointer disabled:opacity-50"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                >
                  <option value="">— اختر مجموعة —</option>
                  {availableGroups.map((g) => (
                    // المجموعات المفلترة حسب المدرب المختار
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
              {/* رسالة تظهر لما المدرب مختار ولكن مفيش مجموعات */}
              {selectedCoach && availableGroups.length === 0 && (
                <p className="text-xs" style={{ color: "var(--gold)" }}>
                  لا توجد مجموعات لهذا المدرب بعد
                </p>
              )}
            </div>

            {/* رسالة الخطأ */}
            {modalError && (
              <p
                className="text-sm text-center rounded-lg p-3"
                style={{
                  background: "oklch(0.65 0.22 25 / 10%)",
                  color: "var(--destructive)",
                  border: "1px solid oklch(0.65 0.22 25 / 30%)",
                }}
              >
                {modalError}
              </p>
            )}

            {/* أزرار التأكيد والإلغاء */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeReassign} // إلغاء وإغلاق المودال
                disabled={isSubmitting}
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 font-semibold"
                onClick={handleReassign} // تنفيذ إعادة التعيين
                disabled={isSubmitting || !selectedCoach || !selectedGroup}
                style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الحفظ...</>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
