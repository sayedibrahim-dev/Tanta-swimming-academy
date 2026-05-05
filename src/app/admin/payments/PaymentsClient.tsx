// تحديد إن المكوّن ده Client Component
"use client";

// استيراد useState لإدارة حالة المكوّن
import { useState } from "react";

// استيراد الأيقونات المستخدمة
import {
  CheckCircle2,  // أيقونة القبول
  XCircle,       // أيقونة الرفض
  CreditCard,    // أيقونة الحالة الفارغة
  ExternalLink,  // أيقونة فتح الصورة في تاب جديد
  X,             // أيقونة إغلاق الـ modal
  Loader2,       // أيقونة التحميل الدوارة
  User,          // أيقونة ولي الأمر
  Phone,         // أيقونة التليفون
  Calendar,      // أيقونة التاريخ
} from "lucide-react";

// استيراد مكوّن الزرار
import { Button } from "@/components/ui/button";

// استيراد نوع بيانات الدفعة من صفحة السيرفر
import type { PaymentItem } from "./page";

// ==========================================
// أسماء الشهور بالعربية
// ==========================================
const monthNames: Record<number, string> = {
  1: "يناير", 2: "فبراير", 3: "مارس",
  4: "أبريل", 5: "مايو",   6: "يونيو",
  7: "يوليو", 8: "أغسطس", 9: "سبتمبر",
  10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
};

// ==========================================
// دالة تحويل التاريخ لصيغة عربية مقروءة
// ==========================================
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ==========================================
// Props المكوّن الرئيسي
// ==========================================
interface PaymentsClientProps {
  initialPayments: PaymentItem[]; // المدفوعات المعلقة من السيرفر
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function PaymentsClient({ initialPayments }: PaymentsClientProps) {

  // قائمة المدفوعات — بتتحدث لما نقبل أو نرفض إيصال
  const [payments, setPayments] = useState(initialPayments);

  // معرف الدفعة اللي بيتم مراجعتها دلوقتي (للـ modal)
  const [confirmModal, setConfirmModal] = useState<{
    paymentId: string;  // معرف الدفعة
    swimmerId: string;  // معرف السباح (محتاجه لتحديث payment_status)
    action: "approve" | "reject"; // نوع الإجراء
    swimmerName: string; // اسم السباح للعرض في الـ modal
    monthYear: string;   // الشهر والسنة للعرض في الـ modal
  } | null>(null);

  // حالة التحميل أثناء إرسال القرار للـ API
  const [submitting, setSubmitting] = useState(false);

  // رسالة الخطأ لو حصل مشكلة
  const [actionError, setActionError] = useState<string | null>(null);

  // ==========================================
  // دالة فتح modal التأكيد
  // ==========================================
  const openConfirm = (
    paymentId: string,
    swimmerId: string,
    action: "approve" | "reject",
    swimmerName: string,
    month: number,
    year: number,
  ) => {
    setActionError(null); // مسح الأخطاء السابقة
    setConfirmModal({
      paymentId,
      swimmerId,
      action,
      swimmerName,
      monthYear: `${monthNames[month]} ${year}`, // تحويل الشهر لاسمه العربي مع السنة
    });
  };

  // ==========================================
  // دالة إزالة الدفعة من القائمة بعد القرار (Optimistic Update)
  // ==========================================
  const removePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  // ==========================================
  // دالة تأكيد القرار وإرساله للـ API
  // ==========================================
  const handleConfirm = async () => {
    if (!confirmModal) return; // لو الـ modal مش مفتوح — اخرج

    setSubmitting(true);  // تفعيل حالة التحميل
    setActionError(null); // مسح الأخطاء السابقة

    // تحديد الـ endpoint حسب نوع الإجراء (قبول أو رفض)
    const endpoint = `/api/admin/payments/${confirmModal.paymentId}/${confirmModal.action}`;

    // إرسال الطلب للـ API
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // لا يحتاج body — معرف الدفعة موجود في الـ URL
      body: JSON.stringify({}),
    });

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ من الـ API — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // نجاح: إزالة الدفعة من القائمة وإغلاق الـ modal
    removePayment(confirmModal.paymentId);
    setConfirmModal(null);
  };

  // ==========================================
  // الحالة الفارغة — مفيش مدفوعات معلقة
  // ==========================================
  if (payments.length === 0) {
    return (
      <div
        className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* أيقونة كبيرة */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cyan-muted)" }}
        >
          <CreditCard className="w-8 h-8" style={{ color: "var(--cyan)" }} />
        </div>

        {/* نص الحالة الفارغة */}
        <div>
          <p className="text-lg font-semibold text-white">لا توجد إيصالات معلقة</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            كل الإيصالات تمت مراجعتها
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // عرض قائمة بطاقات الإيصالات
  // ==========================================
  return (
    <>
      {/* قائمة البطاقات */}
      <div className="space-y-4">
        {payments.map((payment) => {

          // استخراج بيانات السباح
          const swimmer = payment.swimmer;

          // استخراج بيانات ولي الأمر
          const parent = swimmer?.parent;

          return (
            // بطاقة الإيصال الواحد
            <div
              key={payment.id}
              className="rounded-2xl p-5 border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-5">

                {/* ==========================================
                    صورة الإيصال المصغرة — قابلة للنقر للتكبير
                    ========================================== */}
                <a
                  href={payment.receipt_image_url} // رابط الصورة الكاملة
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 relative group"
                  title="عرض الإيصال كاملاً"
                >
                  {/* الصورة المصغرة */}
                  <img
                    src={payment.receipt_image_url}
                    alt="إيصال الدفع"
                    className="w-20 h-24 object-cover rounded-xl border"
                    style={{ borderColor: "var(--border)" }}
                  />

                  {/* طبقة hover فوق الصورة */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "oklch(0.08 0 0 / 70%)" }}
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                </a>

                {/* ==========================================
                    عمود البيانات
                    ========================================== */}
                <div className="flex-1 min-w-0">

                  {/* صف العنوان — اسم السباح والشهر */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      {/* اسم السباح */}
                      <h3 className="text-base font-semibold text-white">
                        {swimmer?.name ?? "—"}
                      </h3>

                      {/* الشهر والسنة — مميز بلون ذهبي */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="text-sm font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "var(--gold-muted)", color: "var(--gold)" }}
                        >
                          {monthNames[payment.month]} {payment.year}
                        </span>
                      </div>
                    </div>

                    {/* تاريخ رفع الإيصال */}
                    <div
                      className="flex items-center gap-1.5 text-xs flex-shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(payment.created_at)}
                    </div>
                  </div>

                  {/* بيانات ولي الأمر */}
                  <div className="mt-3 flex flex-wrap gap-4">

                    {/* اسم ولي الأمر */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      <span style={{ color: "var(--muted-foreground)" }}>ولي الأمر:</span>
                      <span className="text-white font-medium">{parent?.name ?? "—"}</span>
                    </div>

                    {/* رقم التليفون — بيظهر بس لو موجود */}
                    {parent?.phone && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
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

                    {/* زرار القبول */}
                    <Button
                      onClick={() => openConfirm(
                        payment.id,
                        payment.swimmer_id,
                        "approve",
                        swimmer?.name ?? "السباح",
                        payment.month,
                        payment.year,
                      )}
                      className="flex items-center gap-2 text-sm font-medium h-9 px-4"
                      style={{
                        background: "var(--cyan-muted)",
                        color: "var(--cyan)",
                        border: "1px solid oklch(0.72 0.18 195 / 30%)",
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      قبول
                    </Button>

                    {/* زرار الرفض */}
                    <Button
                      onClick={() => openConfirm(
                        payment.id,
                        payment.swimmer_id,
                        "reject",
                        swimmer?.name ?? "السباح",
                        payment.month,
                        payment.year,
                      )}
                      variant="ghost"
                      className="flex items-center gap-2 text-sm font-medium h-9 px-4"
                      style={{
                        background: "oklch(0.65 0.22 25 / 15%)",
                        color: "oklch(0.65 0.22 25)",
                        border: "1px solid oklch(0.65 0.22 25 / 30%)",
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
          Modal التأكيد — للقبول والرفض معاً
          ========================================== */}
      {confirmModal && (
        // خلفية داكنة شبه شفافة
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => {
            // النقر خارج الـ modal بيقفله
            if (e.target === e.currentTarget) setConfirmModal(null);
          }}
        >
          {/* بطاقة الـ modal */}
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">

                {/* أيقونة حسب نوع الإجراء */}
                {confirmModal.action === "approve" ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                ) : (
                  <XCircle className="w-5 h-5" style={{ color: "oklch(0.65 0.22 25)" }} />
                )}

                {/* عنوان الـ modal حسب نوع الإجراء */}
                <h2 className="text-lg font-semibold text-white">
                  {confirmModal.action === "approve" ? "قبول الإيصال" : "رفض الإيصال"}
                </h2>
              </div>

              {/* زرار إغلاق الـ modal */}
              <button
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* نص التأكيد */}
            <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
              {confirmModal.action === "approve"
                ? `هل تريد قبول إيصال ${confirmModal.monthYear} للسباح "${confirmModal.swimmerName}"؟`
                : `هل تريد رفض إيصال ${confirmModal.monthYear} للسباح "${confirmModal.swimmerName}"؟`
              }
            </p>

            {/* رسالة الخطأ — بتظهر بس لو فيه خطأ */}
            {actionError && (
              <p
                className="text-sm rounded-lg p-3 mb-4"
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
            <div className="flex gap-3">

              {/* زرار التأكيد — لونه حسب نوع الإجراء */}
              <Button
                onClick={handleConfirm}
                disabled={submitting} // معطّل أثناء الإرسال
                className="flex-1 font-semibold h-10"
                style={{
                  background: confirmModal.action === "approve"
                    ? "var(--cyan)"              // سيان للقبول
                    : "oklch(0.65 0.22 25)",     // أحمر للرفض
                  color: confirmModal.action === "approve"
                    ? "var(--cyan-foreground)"
                    : "white",
                }}
              >
                {/* أيقونة تحميل أو نص حسب الحالة */}
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmModal.action === "approve" ? (
                  "تأكيد القبول"
                ) : (
                  "تأكيد الرفض"
                )}
              </Button>

              {/* زرار الإلغاء */}
              <Button
                onClick={() => setConfirmModal(null)}
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
      )}
    </>
  );
}
