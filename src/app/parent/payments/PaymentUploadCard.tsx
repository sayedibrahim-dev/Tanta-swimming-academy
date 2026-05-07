"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle, Upload } from "lucide-react";
import ImageUploader from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// استيراد ثابت ترجمة المستويات المشترك
import { levelLabels } from "@/lib/types";

interface PaymentUploadCardProps {
  swimmer: { id: string; name: string; age: number; level: string };
  payment: {
    id: string;
    status: string;
    receipt_image_url: string;
    created_at: string;
    rejection_note?: string | null; // سبب الرفض من الأدمن (ممكن يكون فارغ)
  } | null;
  currentMonth: number;
  currentYear: number;
  monthName: string;
}

export default function PaymentUploadCard({
  swimmer,
  payment,
  currentMonth,
  currentYear,
  monthName,
}: PaymentUploadCardProps) {
  const router = useRouter();
  const [receiptUrl, setReceiptUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  // ==========================================
  // إرسال إيصال الدفع للـ API
  // ==========================================
  const handleSubmit = async () => {
    if (!receiptUrl) {
      setError("يرجى رفع صورة الإيصال أولاً");
      return;
    }
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/parent/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        swimmer_id: swimmer.id,
        month: currentMonth,
        year: currentYear,
        receipt_image_url: receiptUrl,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "حدث خطأ، حاول مجدداً");
      return;
    }

    // تحديث الصفحة لعرض الحالة الجديدة
    router.refresh();
  };

  // ==========================================
  // تحديد شكل البطاقة حسب حالة الدفع
  // ==========================================
  const getStatusDisplay = () => {
    if (!payment) {
      return {
        label: "لم يُرفع إيصال",
        color: "var(--destructive)",
        bg: "oklch(0.65 0.22 25 / 15%)",
        icon: XCircle,
      };
    }
    if (payment.status === "pending") {
      return {
        label: "قيد المراجعة",
        color: "var(--gold)",
        bg: "var(--gold-muted)",
        icon: Clock,
      };
    }
    if (payment.status === "approved") {
      return {
        label: "مدفوع ومقبول ✓",
        color: "oklch(0.72 0.2 145)",
        bg: "oklch(0.65 0.18 145 / 15%)",
        icon: CheckCircle2,
      };
    }
    // مرفوض
    return {
      label: "مرفوض — يرجى إعادة الرفع",
      color: "var(--destructive)",
      bg: "oklch(0.65 0.22 25 / 15%)",
      icon: XCircle,
    };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  // السباح يحتاج رفع إيصال إذا لم يدفع أو كان مرفوضاً
  const needsPayment = !payment || payment.status === "rejected";

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* معلومات السباح وحالة الدفع */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-white">{swimmer.name}</h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {swimmer.age} سنة · {levelLabels[swimmer.level]} · اشتراك {monthName}
          </p>
        </div>

        {/* شارة الحالة */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: statusDisplay.bg, color: statusDisplay.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusDisplay.label}
        </div>
      </div>

      {/* ==========================================
          قسم رفع الإيصال (يظهر فقط لو محتاج دفع)
          ========================================== */}
      {needsPayment && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          {!showUploader ? (
            // زر إظهار منطقة الرفع
            <button
              onClick={() => setShowUploader(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border-2 border-dashed transition-all hover:bg-white/5"
              style={{ borderColor: "var(--cyan)", color: "var(--cyan)" }}
            >
              <Upload className="w-4 h-4" />
              رفع إيصال {monthName}
            </button>
          ) : (
            <div className="space-y-3">
              <ImageUploader
                bucket="payment-receipts"
                folder={swimmer.id}
                onUploadComplete={setReceiptUrl}
                label={`إيصال اشتراك ${monthName}`}
              />

              {error && (
                <p className="text-xs" style={{ color: "var(--destructive)" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !receiptUrl}
                  className="flex-1 font-medium"
                  style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
                >
                  {submitting ? "جاري الإرسال..." : "إرسال الإيصال"}
                </Button>
                <Button
                  onClick={() => { setShowUploader(false); setReceiptUrl(""); setError(null); }}
                  variant="outline"
                  className="border-border text-white hover:bg-white/5"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* إيصال مقبول: عرض تاريخ الدفع */}
      {payment?.status === "approved" && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            تاريخ الدفع: {new Date(payment.created_at).toLocaleDateString("ar-EG")}
          </p>
        </div>
      )}

      {/* إيصال مرفوض: عرض سبب الرفض لو موجود */}
      {payment?.status === "rejected" && payment.rejection_note && (
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              background: "oklch(0.65 0.22 25 / 10%)",
              border: "1px solid oklch(0.65 0.22 25 / 25%)",
              color: "oklch(0.75 0.18 25)", // أحمر فاتح للقراءة
            }}
          >
            {/* عنوان السبب */}
            <p className="font-semibold mb-1 text-xs" style={{ color: "var(--destructive)" }}>
              سبب الرفض:
            </p>
            {/* نص السبب */}
            <p>{payment.rejection_note}</p>
          </div>
        </div>
      )}

      {/* إيصال قيد المراجعة */}
      {payment?.status === "pending" && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--gold)" }}>
            ⏳ تم رفع الإيصال بتاريخ {new Date(payment.created_at).toLocaleDateString("ar-EG")}، في انتظار مراجعة الإدارة
          </p>
        </div>
      )}
    </div>
  );
}
