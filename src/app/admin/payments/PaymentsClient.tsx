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
  Clock,         // أيقونة المعلق
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
  initialPayments: PaymentItem[]; // كل المدفوعات (معلقة + مقبولة) من السيرفر
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function PaymentsClient({ initialPayments }: PaymentsClientProps) {

  // قائمة كل المدفوعات — بتتحدث لما نقبل أو نرفض إيصال
  const [payments, setPayments] = useState(initialPayments);

  // التاب النشط: "pending" = ينتظر المراجعة | "approved" = المقبولة
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  // تصفية المدفوعات حسب الحالة
  const pendingPayments  = payments.filter((p) => p.status === "pending");
  const approvedPayments = payments.filter((p) => p.status === "approved");

  // معرف الدفعة اللي بيتم مراجعتها دلوقتي (للـ modal)
  const [confirmModal, setConfirmModal] = useState<{
    paymentId: string;    // معرف الدفعة
    swimmerId: string;    // معرف السباح
    action: "approve" | "reject"; // نوع الإجراء
    swimmerName: string;  // اسم السباح للعرض
    monthYear: string;    // الشهر والسنة للعرض
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
      monthYear: `${monthNames[month]} ${year}`, // الشهر بالعربي مع السنة
    });
  };

  // ==========================================
  // تحديث حالة الدفعة في القائمة المحلية (عند القبول)
  // ==========================================
  const approvePaymentLocally = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "approved" } : p))
    );
  };

  // ==========================================
  // إزالة الدفعة من القائمة (عند الرفض)
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
      body: JSON.stringify({}), // لا يحتاج body — الـ ID في الـ URL
    });

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ من الـ API — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // نجاح:
    if (confirmModal.action === "approve") {
      approvePaymentLocally(confirmModal.paymentId); // انقل للمقبولة
      setActiveTab("approved"); // انتقل لتاب المقبولة عشان يشوف الإيصال
    } else {
      removePayment(confirmModal.paymentId); // شيل من الرفض
    }

    setConfirmModal(null); // أغلق الـ modal
  };

  // ==========================================
  // مكوّن بطاقة إيصال (قابل للإعادة الاستخدام)
  // ==========================================
  const PaymentCard = ({
    payment,
    showActions,
  }: {
    payment: PaymentItem;
    showActions: boolean; // true = يعرض أزرار القبول/الرفض | false = يعرض بادج "مقبول" فقط
  }) => {
    const swimmer = payment.swimmer;
    const parent  = swimmer?.parent;

    return (
      // بطاقة الإيصال
      <div
        className="rounded-2xl p-5 border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start gap-5">

          {/* ==========================================
              صورة الإيصال المصغرة — قابلة للنقر للتكبير
              ========================================== */}
          <a
            href={payment.receipt_image_url}
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="text-sm font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--gold-muted)", color: "var(--gold)" }}
                  >
                    {monthNames[payment.month]} {payment.year}
                  </span>

                  {/* بادج "مقبول" — يظهر فقط في تاب المقبولة */}
                  {!showActions && (
                    <span
                      className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--cyan-muted)",
                        color: "var(--cyan)",
                        border: "1px solid oklch(0.72 0.18 195 / 30%)",
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      مقبول
                    </span>
                  )}
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
                <User
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <span style={{ color: "var(--muted-foreground)" }}>ولي الأمر:</span>
                <span className="text-white font-medium">{parent?.name ?? "—"}</span>
              </div>

              {/* رقم التليفون — بيظهر بس لو موجود */}
              {parent?.phone && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <span
                    className="font-mono"
                    style={{ color: "var(--muted-foreground)", direction: "ltr" }}
                  >
                    {parent.phone}
                  </span>
                </div>
              )}
            </div>

            {/* ==========================================
                أزرار القبول والرفض — فقط في تاب "ينتظر المراجعة"
                ========================================== */}
            {showActions && (
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
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // الواجهة الرئيسية
  // ==========================================
  return (
    <>
      {/* ==========================================
          التابات — ينتظر المراجعة | المقبولة
          ========================================== */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "var(--secondary)" }}
      >
        {/* تاب ينتظر المراجعة */}
        <button
          onClick={() => setActiveTab("pending")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={
            activeTab === "pending"
              ? {
                  background: "var(--card)",
                  color: "var(--cyan)",
                  boxShadow: "0 1px 4px oklch(0 0 0 / 30%)",
                }
              : { color: "var(--muted-foreground)" }
          }
        >
          <Clock className="w-4 h-4" />
          ينتظر المراجعة
          {/* عداد المعلقة */}
          {pendingPayments.length > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
              style={{
                background: activeTab === "pending"
                  ? "var(--cyan-muted)"
                  : "oklch(0.65 0.22 25 / 20%)",
                color: activeTab === "pending"
                  ? "var(--cyan)"
                  : "oklch(0.65 0.22 25)",
              }}
            >
              {pendingPayments.length}
            </span>
          )}
        </button>

        {/* تاب المقبولة */}
        <button
          onClick={() => setActiveTab("approved")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={
            activeTab === "approved"
              ? {
                  background: "var(--card)",
                  color: "var(--cyan)",
                  boxShadow: "0 1px 4px oklch(0 0 0 / 30%)",
                }
              : { color: "var(--muted-foreground)" }
          }
        >
          <CheckCircle2 className="w-4 h-4" />
          المقبولة
          {/* عداد المقبولة */}
          {approvedPayments.length > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
              style={{
                background: activeTab === "approved"
                  ? "var(--cyan-muted)"
                  : "var(--secondary)",
                color: activeTab === "approved"
                  ? "var(--cyan)"
                  : "var(--muted-foreground)",
              }}
            >
              {approvedPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* ==========================================
          محتوى تاب "ينتظر المراجعة"
          ========================================== */}
      {activeTab === "pending" && (
        pendingPayments.length === 0 ? (
          // حالة فارغة
          <div
            className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--cyan-muted)" }}
            >
              <CreditCard className="w-8 h-8" style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">لا توجد إيصالات معلقة</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                كل الإيصالات تمت مراجعتها
              </p>
            </div>
          </div>
        ) : (
          // قائمة الإيصالات المعلقة
          <div className="space-y-4">
            {pendingPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} showActions={true} />
            ))}
          </div>
        )
      )}

      {/* ==========================================
          محتوى تاب "المقبولة"
          ========================================== */}
      {activeTab === "approved" && (
        approvedPayments.length === 0 ? (
          // حالة فارغة
          <div
            className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--cyan-muted)" }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">لا توجد مدفوعات مقبولة بعد</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                ستظهر هنا الإيصالات بعد قبولها
              </p>
            </div>
          </div>
        ) : (
          // قائمة الإيصالات المقبولة
          <div className="space-y-4">
            {approvedPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} showActions={false} />
            ))}
          </div>
        )
      )}

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
