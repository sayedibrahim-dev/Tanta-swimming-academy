// تحديد إن المكوّن ده Client Component (بيشتغل في المتصفح)
"use client";

// استيراد useState لإدارة حالة المكوّن (الـ modals، الداتا، إلخ)
import { useState } from "react";

// استيراد الأيقونات المستخدمة في الصفحة
import {
  CheckCircle2, // أيقونة القبول
  XCircle,      // أيقونة الرفض
  ClipboardList, // أيقونة الحالة الفارغة
  ExternalLink,  // أيقونة فتح الصورة في تاب جديد
  X,             // أيقونة إغلاق الـ modal
  Loader2,       // أيقونة التحميل الدوارة
  User,          // أيقونة ولي الأمر
  Phone,         // أيقونة التليفون
  Calendar,      // أيقونة التاريخ
} from "lucide-react";

// استيراد مكوّن الزرار من shadcn/ui
import { Button } from "@/components/ui/button";

// استيراد نوع بيانات الطلب من صفحة السيرفر
import type { RequestItem } from "./page";

// استيراد الأنواع والثوابت المشتركة
import type { CoachOption, GroupOption } from "@/lib/types";
import { levelLabels } from "@/lib/types";

// ==========================================
// تعريف أنواع الـ Props للمكوّنات المساعدة
// ==========================================

// شكل الـ Props اللي بيستقبلها المكوّن الرئيسي
interface RequestsClientProps {
  initialRequests: RequestItem[]; // الطلبات المعلقة من السيرفر
  coaches: CoachOption[];         // قائمة المدربين للـ dropdown
  groups: GroupOption[];          // قائمة المجموعات للـ dropdown
}

// ==========================================
// ألوان كل مستوى (خلفية + نص)
// ==========================================
const levelColors = {
  beginner: { bg: "var(--cyan-muted)", text: "var(--cyan)" },           // سيان للمبتدئ
  intermediate: { bg: "var(--gold-muted)", text: "var(--gold)" },       // ذهبي للمتوسط
  advanced: {
    bg: "oklch(0.65 0.22 25 / 15%)",   // أحمر خفيف للمتقدم
    text: "oklch(0.65 0.22 25)",        // أحمر للنص
  },
} as const;

// ==========================================
// دالة تحويل التاريخ لصيغة عربية مقروءة
// ==========================================
function formatDate(iso: string) {
  // تحويل الـ ISO string لتاريخ عربي (مثال: ٢ مايو ٢٠٢٦)
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function RequestsClient({
  initialRequests, // الطلبات الأولية من السيرفر
  coaches,         // قائمة المدربين
  groups,          // قائمة المجموعات
}: RequestsClientProps) {

  // قائمة الطلبات — بتتحدث لما نقبل أو نرفض طلب (بنشيله من القائمة)
  const [requests, setRequests] = useState(initialRequests);

  // حالة modal القبول — null = مغلق، object = مفتوح مع بيانات الطلب
  const [approveModal, setApproveModal] = useState<{
    requestId: string;  // معرف الطلب اللي بنقبله
    swimmerId: string;  // معرف السباح (مش مستخدم هنا بس محتاجينه للمستقبل)
  } | null>(null);

  // المدرب المختار في modal القبول
  const [selectedCoachId, setSelectedCoachId] = useState("");

  // المجموعة المختارة في modal القبول
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // حالة modal الرفض — null = مغلق، object = مفتوح مع معرف الطلب
  const [rejectModal, setRejectModal] = useState<{
    requestId: string; // معرف الطلب اللي بنرفضه
  } | null>(null);

  // نص سبب الرفض اللي بيكتبه الأدمن
  const [rejectNotes, setRejectNotes] = useState("");

  // حالة التحميل أثناء إرسال طلب القبول أو الرفض للـ API
  const [submitting, setSubmitting] = useState(false);

  // رسالة الخطأ لو حصل مشكلة أثناء القبول أو الرفض
  const [actionError, setActionError] = useState<string | null>(null);

  // فلترة المجموعات — بيعرض بس المجموعات التابعة للمدرب المختار
  const filteredGroups = groups.filter(
    (g) => g.coach_id === selectedCoachId
  );

  // ==========================================
  // دالة فتح modal القبول
  // ==========================================
  const openApprove = (requestId: string, swimmerId: string) => {
    setSelectedCoachId("");  // إعادة تعيين المدرب لما نفتح modal جديد
    setSelectedGroupId(""); // إعادة تعيين المجموعة
    setActionError(null);   // مسح أي خطأ سابق
    setApproveModal({ requestId, swimmerId }); // فتح الـ modal مع بيانات الطلب
  };

  // ==========================================
  // دالة فتح modal الرفض
  // ==========================================
  const openReject = (requestId: string) => {
    setRejectNotes("");    // مسح النص السابق
    setActionError(null);  // مسح أي خطأ سابق
    setRejectModal({ requestId }); // فتح الـ modal مع معرف الطلب
  };

  // ==========================================
  // دالة إزالة الطلب من القائمة بعد القرار
  // (Optimistic Update — بدون ما ننتظر reload للصفحة)
  // ==========================================
  const removeRequest = (requestId: string) => {
    // نعمل فلتر ونشيل الطلب اللي اتخذنا فيه قرار
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // ==========================================
  // دالة إرسال طلب القبول للـ API
  // ==========================================
  const handleApprove = async () => {
    // لو الـ modal مش مفتوح — اخرج
    if (!approveModal) return;

    // التحقق من اختيار مدرب ومجموعة قبل الإرسال
    if (!selectedCoachId || !selectedGroupId) {
      setActionError("يرجى اختيار المدرب والمجموعة");
      return;
    }

    setSubmitting(true);  // تفعيل حالة التحميل
    setActionError(null); // مسح الأخطاء السابقة

    // إرسال طلب POST للـ API مع معرف المدرب والمجموعة
    const res = await fetch(
      `/api/admin/requests/${approveModal.requestId}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coach_id: selectedCoachId, // المدرب المختار
          group_id: selectedGroupId, // المجموعة المختارة
        }),
      }
    );

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ من الـ API — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // نجاح: إزالة الطلب من القائمة وإغلاق الـ modal
    removeRequest(approveModal.requestId);
    setApproveModal(null);
  };

  // ==========================================
  // دالة إرسال طلب الرفض للـ API
  // ==========================================
  const handleReject = async () => {
    // لو الـ modal مش مفتوح — اخرج
    if (!rejectModal) return;

    // التحقق من كتابة سبب الرفض قبل الإرسال
    if (!rejectNotes.trim()) {
      setActionError("يرجى كتابة سبب الرفض");
      return;
    }

    setSubmitting(true);  // تفعيل حالة التحميل
    setActionError(null); // مسح الأخطاء السابقة

    // إرسال طلب POST للـ API مع سبب الرفض
    const res = await fetch(
      `/api/admin/requests/${rejectModal.requestId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: rejectNotes.trim() }), // سبب الرفض بدون مسافات زيادة
      }
    );

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ من الـ API — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // نجاح: إزالة الطلب من القائمة وإغلاق الـ modal
    removeRequest(rejectModal.requestId);
    setRejectModal(null);
  };

  // ==========================================
  // الحالة الفارغة — لما مفيش طلبات معلقة
  // ==========================================
  if (requests.length === 0) {
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
          <ClipboardList className="w-8 h-8" style={{ color: "var(--cyan)" }} />
        </div>

        {/* نص الحالة الفارغة */}
        <div>
          <p className="text-lg font-semibold text-white">
            لا توجد طلبات معلقة
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            كل الطلبات تمت مراجعتها
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // عرض قائمة بطاقات الطلبات
  // ==========================================
  return (
    <>
      {/* قائمة البطاقات بمسافة بين كل بطاقة */}
      <div className="space-y-4">

        {/* تكرار على كل طلب وعرض بطاقته */}
        {requests.map((req) => {

          // استخراج بيانات السباح من داخل الطلب
          const swimmer = req.swimmer;

          // استخراج بيانات ولي الأمر من داخل بيانات السباح
          const parent = swimmer?.parent;

          // مستوى السباح مع قيمة افتراضية لو مش موجود
          const level = swimmer?.level ?? "beginner";

          // ألوان المستوى المقابلة
          const colors = levelColors[level];

          return (
            // بطاقة الطلب الواحد
            <div
              key={req.id} // مفتاح فريد لكل عنصر في القائمة (مطلوب من React)
              className="rounded-2xl p-5 border"
              style={{
                background: "var(--card)",       // خلفية البطاقة الداكنة
                borderColor: "var(--border)",    // حد البطاقة
              }}
            >
              {/* محتوى البطاقة — صورة الإيصال على اليمين، البيانات على اليسار */}
              <div className="flex items-start gap-5">

                {/* ==========================================
                    صورة الإيصال المصغرة — قابلة للنقر للتكبير
                    ========================================== */}
                <a
                  href={req.receipt_image_url} // رابط الصورة الأصلية
                  target="_blank"              // فتح في تاب جديد
                  rel="noopener noreferrer"    // حماية من هجمات التنقل
                  className="flex-shrink-0 relative group" // flex-shrink-0 يمنع الصورة من الانكماش
                  title="عرض الإيصال كاملاً"
                >
                  {/* الصورة المصغرة */}
                  <img
                    src={req.receipt_image_url}
                    alt="إيصال الالتحاق"
                    className="w-20 h-24 object-cover rounded-xl border" // حجم ثابت مع قص الزيادة
                    style={{ borderColor: "var(--border)" }}
                  />

                  {/* طبقة Hover فوق الصورة بتظهر أيقونة التكبير */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "oklch(0.08 0 0 / 70%)" }} // خلفية شبه شفافة
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                </a>

                {/* ==========================================
                    عمود البيانات — الاسم والمستوى وولي الأمر والأزرار
                    ========================================== */}
                <div className="flex-1 min-w-0"> {/* min-w-0 يمنع الـ overflow */}

                  {/* صف العنوان — الاسم والمستوى على اليمين، التاريخ على اليسار */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      {/* اسم السباح + بادج المستوى جنب بعض */}
                      <div className="flex items-center gap-2 flex-wrap">

                        {/* اسم السباح */}
                        <h3 className="text-base font-semibold text-white">
                          {swimmer?.name ?? "—"} {/* "—" لو الاسم مش موجود */}
                        </h3>

                        {/* بادج المستوى بلون ديناميكي حسب المستوى */}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: colors.bg, // خلفية حسب المستوى
                            color: colors.text,    // لون النص حسب المستوى
                          }}
                        >
                          {levelLabels[level]} {/* الترجمة العربية للمستوى */}
                        </span>
                      </div>

                      {/* عمر السباح */}
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {swimmer?.age} سنة
                      </p>
                    </div>

                    {/* تاريخ إرسال الطلب */}
                    <div
                      className="flex items-center gap-1.5 text-xs flex-shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(req.created_at)} {/* تحويل التاريخ للعربية */}
                    </div>
                  </div>

                  {/* بيانات ولي الأمر — الاسم والتليفون */}
                  <div className="mt-3 flex flex-wrap gap-4">

                    {/* اسم ولي الأمر */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      <span style={{ color: "var(--muted-foreground)" }}>
                        ولي الأمر:
                      </span>
                      <span className="text-white font-medium">
                        {parent?.name ?? "—"} {/* "—" لو الاسم مش موجود */}
                      </span>
                    </div>

                    {/* رقم التليفون — بيظهر بس لو موجود */}
                    {parent?.phone && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                        {/* direction: ltr عشان الأرقام تتعرض صح */}
                        <span
                          className="font-mono"
                          style={{ color: "var(--muted-foreground)", direction: "ltr" }}
                        >
                          {parent.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* أزرار القبول والرفض */}
                  <div className="mt-4 flex items-center gap-3">

                    {/* زرار القبول — بيفتح modal القبول */}
                    <Button
                      onClick={() => openApprove(req.id, req.swimmer_id)}
                      className="flex items-center gap-2 text-sm font-medium h-9 px-4"
                      style={{
                        background: "var(--cyan-muted)",                       // خلفية سيان خفيفة
                        color: "var(--cyan)",                                  // نص سيان
                        border: "1px solid oklch(0.72 0.18 195 / 30%)",       // حد سيان خفيف
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      قبول
                    </Button>

                    {/* زرار الرفض — بيفتح modal الرفض */}
                    <Button
                      onClick={() => openReject(req.id)}
                      variant="ghost"
                      className="flex items-center gap-2 text-sm font-medium h-9 px-4"
                      style={{
                        background: "oklch(0.65 0.22 25 / 15%)",  // خلفية حمراء خفيفة
                        color: "oklch(0.65 0.22 25)",              // نص أحمر
                        border: "1px solid oklch(0.65 0.22 25 / 30%)", // حد أحمر خفيف
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      رفض
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==========================================
          Modal القبول — بيظهر فوق كل حاجة لما approveModal مش null
          ========================================== */}
      {approveModal && (
        // خلفية داكنة شبه شفافة خلف الـ modal
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          // النقر خارج الـ modal بيقفله
          onClick={(e) => {
            if (e.target === e.currentTarget) setApproveModal(null);
          }}
        >
          {/* بطاقة الـ modal الداخلية */}
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--card)",       // خلفية البطاقة
              border: "1px solid var(--border)", // حد البطاقة
            }}
          >
            {/* رأس الـ modal — العنوان وزرار الإغلاق */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                <h2 className="text-lg font-semibold text-white">قبول الطلب</h2>
              </div>

              {/* زرار إغلاق الـ modal */}
              <button
                onClick={() => setApproveModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* محتوى الـ modal */}
            <div className="space-y-4">

              {/* Dropdown اختيار المدرب */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white">المدرب</label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => {
                    setSelectedCoachId(e.target.value); // تحديث المدرب المختار
                    setSelectedGroupId("");              // إعادة تعيين المجموعة عند تغيير المدرب
                  }}
                  className="w-full h-10 rounded-lg px-3 text-sm outline-none transition-colors"
                  style={{
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    color: selectedCoachId ? "white" : "var(--muted-foreground)", // لون النص حسب الاختيار
                  }}
                >
                  {/* الخيار الافتراضي */}
                  <option value="" disabled>اختر المدرب...</option>

                  {/* قائمة المدربين */}
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}
                      style={{ background: "var(--card)", color: "white" }}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown اختيار المجموعة — معطّل لو مفيش مدرب مختار */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white">المجموعة التدريبية</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)} // تحديث المجموعة المختارة
                  disabled={!selectedCoachId} // معطّل لحد ما يتاختار مدرب
                  className="w-full h-10 rounded-lg px-3 text-sm outline-none transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    color: selectedGroupId ? "white" : "var(--muted-foreground)",
                  }}
                >
                  {/* الخيار الافتراضي — بيتغير حسب الحالة */}
                  <option value="" disabled>
                    {selectedCoachId
                      ? filteredGroups.length === 0
                        ? "لا توجد مجموعات لهذا المدرب" // المدرب مختار بس مفيش مجموعات
                        : "اختر المجموعة..."             // المدرب مختار وفيه مجموعات
                      : "اختر المدرب أولاً"}            // لسه مفيش مدرب مختار
                  </option>

                  {/* المجموعات المفلترة حسب المدرب المختار فقط */}
                  {filteredGroups.map((g) => (
                    <option key={g.id} value={g.id}
                      style={{ background: "var(--card)", color: "white" }}
                    >
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* رسالة الخطأ — بتظهر بس لو فيه خطأ */}
              {actionError && (
                <p
                  className="text-sm rounded-lg p-3"
                  style={{
                    background: "oklch(0.65 0.22 25 / 15%)",
                    color: "oklch(0.65 0.22 25)",
                    border: "1px solid oklch(0.65 0.22 25 / 30%)",
                  }}
                >
                  {actionError}
                </p>
              )}

              {/* أزرار التأكيد والإلغاء */}
              <div className="flex gap-3 pt-2">

                {/* زرار تأكيد القبول */}
                <Button
                  onClick={handleApprove}
                  disabled={submitting} // معطّل أثناء الإرسال
                  className="flex-1 font-semibold h-10"
                  style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
                >
                  {/* عرض أيقونة التحميل أو النص حسب الحالة */}
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "تأكيد القبول"
                  )}
                </Button>

                {/* زرار الإلغاء — يغلق الـ modal */}
                <Button
                  onClick={() => setApproveModal(null)}
                  disabled={submitting} // معطّل أثناء الإرسال
                  variant="ghost"
                  className="flex-1 h-10"
                  style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Modal الرفض — بيظهر فوق كل حاجة لما rejectModal مش null
          ========================================== */}
      {rejectModal && (
        // خلفية داكنة شبه شفافة خلف الـ modal
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          // النقر خارج الـ modal بيقفله
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectModal(null);
          }}
        >
          {/* بطاقة الـ modal الداخلية */}
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            {/* رأس الـ modal — العنوان وزرار الإغلاق */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" style={{ color: "oklch(0.65 0.22 25)" }} />
                <h2 className="text-lg font-semibold text-white">رفض الطلب</h2>
              </div>

              {/* زرار إغلاق الـ modal */}
              <button
                onClick={() => setRejectModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* محتوى الـ modal */}
            <div className="space-y-4">

              {/* حقل كتابة سبب الرفض */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white">سبب الرفض</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)} // تحديث النص عند الكتابة
                  placeholder="مثال: الإيصال غير واضح، يرجى إعادة الرفع..."
                  rows={3}         // ارتفاع الـ textarea (3 أسطر)
                  className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none"
                  style={{
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    color: "white",
                  }}
                />
              </div>

              {/* تنبيه معلوماتي لولي الأمر */}
              <div
                className="text-xs rounded-lg p-3"
                style={{
                  background: "oklch(0.65 0.22 25 / 12%)",  // خلفية حمراء خفيفة جداً
                  color: "oklch(0.75 0.15 25)",               // نص أحمر فاتح
                  border: "1px solid oklch(0.65 0.22 25 / 20%)",
                }}
              >
                سيتم إبلاغ ولي الأمر بسبب الرفض حتى يتمكن من إعادة التقديم
              </div>

              {/* رسالة الخطأ — بتظهر بس لو فيه خطأ */}
              {actionError && (
                <p
                  className="text-sm rounded-lg p-3"
                  style={{
                    background: "oklch(0.65 0.22 25 / 15%)",
                    color: "oklch(0.65 0.22 25)",
                    border: "1px solid oklch(0.65 0.22 25 / 30%)",
                  }}
                >
                  {actionError}
                </p>
              )}

              {/* أزرار التأكيد والإلغاء */}
              <div className="flex gap-3 pt-2">

                {/* زرار تأكيد الرفض */}
                <Button
                  onClick={handleReject}
                  disabled={submitting} // معطّل أثناء الإرسال
                  className="flex-1 font-semibold h-10"
                  style={{ background: "oklch(0.65 0.22 25)", color: "white" }}
                >
                  {/* عرض أيقونة التحميل أو النص حسب الحالة */}
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "تأكيد الرفض"
                  )}
                </Button>

                {/* زرار الإلغاء — يغلق الـ modal */}
                <Button
                  onClick={() => setRejectModal(null)}
                  disabled={submitting} // معطّل أثناء الإرسال
                  variant="ghost"
                  className="flex-1 h-10"
                  style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
