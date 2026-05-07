"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Users,
  Send,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParentItem } from "./page";

interface ParentsClientProps {
  initialParents: ParentItem[];
}

export default function ParentsClient({ initialParents }: ParentsClientProps) {
  const parents = initialParents;

  // ==========================================
  // Modal تأكيد الإرسال — فقط لتأكيد العملية قبل الإرسال
  // لا يحتوي على أي حقل كلمة مرور
  // ==========================================
  const [confirmModal, setConfirmModal] = useState<{
    parentId: string;
    name:     string;
    email:    string;
  } | null>(null);

  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState<string | null>(null);

  // Modal النجاح — يظهر بعد إرسال الرابط
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  // ==========================================
  // فتح modal التأكيد
  // ==========================================
  const openConfirm = (parent: ParentItem) => {
    setSendError(null);
    setConfirmModal({
      parentId: parent.id,
      name:     parent.name,
      email:    parent.user?.email ?? "",
    });
  };

  // ==========================================
  // إرسال طلب الرابط للـ API
  // ==========================================
  const handleSendReset = async () => {
    if (!confirmModal) return;

    setSending(true);
    setSendError(null);

    const res = await fetch(
      `/api/admin/parents/${confirmModal.parentId}/send-reset`,
      { method: "POST" }
    );

    setSending(false);

    if (!res.ok) {
      const data = await res.json();
      setSendError(data.error ?? "حدث خطأ، حاول مرة أخرى");
      return;
    }

    // نجح — أغلق modal التأكيد وافتح modal النجاح
    const savedEmail = confirmModal.email;
    setConfirmModal(null);
    setSuccessEmail(savedEmail);
  };

  // ==========================================
  // الحالة الفارغة
  // ==========================================
  if (parents.length === 0) {
    return (
      <div
        className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cyan-muted)" }}
        >
          <User className="w-8 h-8" style={{ color: "var(--cyan)" }} />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">لا يوجد أولياء أمور بعد</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            سيظهرون هنا بعد تسجيلهم في البرنامج
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* إجمالي أولياء الأمور */}
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        إجمالي أولياء الأمور: <span className="text-white font-semibold">{parents.length}</span>
      </p>

      {/* شبكة البطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {parents.map((parent) => {
          const swimmerCount = parent.swimmers?.length ?? 0;

          return (
            <div
              key={parent.id}
              className="rounded-2xl p-5 border flex flex-col gap-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* رأس البطاقة */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--cyan-muted)" }}
                >
                  <User className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{parent.name}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--cyan-muted)", color: "var(--cyan)" }}
                  >
                    {swimmerCount} {swimmerCount === 1 ? "سباح" : "سباحون"}
                  </span>
                </div>
              </div>

              {/* التفاصيل */}
              <div className="space-y-2">
                {parent.user?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <span className="truncate font-mono text-xs" style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                      {parent.user.email}
                    </span>
                  </div>
                )}
                {parent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                      {parent.phone}
                    </span>
                  </div>
                )}
                {swimmerCount > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ color: "var(--muted-foreground)" }} className="text-xs">
                      {parent.swimmers.map((s) => s.name).join("، ")}
                    </span>
                  </div>
                )}
              </div>

              {/* ==========================================
                  الزرار — إرسال رابط بريد إلكتروني
                  لا يوجد حقل كلمة مرور هنا على الإطلاق
                  ========================================== */}
              <button
                onClick={() => openConfirm(parent)}
                className="mt-auto flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  background: "var(--gold-muted)",
                  color:      "var(--gold)",
                  border:     "1px solid oklch(0.85 0.16 85 / 30%)",
                }}
              >
                <Send className="w-3.5 h-3.5" />
                إرسال رابط إعادة كلمة المرور
              </button>
            </div>
          );
        })}
      </div>

      {/* ==========================================
          Modal التأكيد — فقط تأكيد، لا يوجد إدخال
          ========================================== */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !sending) setConfirmModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" style={{ color: "var(--gold)" }} />
                <h2 className="text-lg font-semibold text-white">إرسال رابط إعادة كلمة المرور</h2>
              </div>
              <button
                onClick={() => { if (!sending) setConfirmModal(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* رسالة التأكيد */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm text-white mb-1 font-medium">{confirmModal.name}</p>
              <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                {confirmModal.email}
              </p>
            </div>

            <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
              سيصل رابط لبريده الإلكتروني يمكّنه من تعيين كلمة مرور جديدة بنفسه.
              الرابط صالح لمدة <span className="text-white font-semibold">ساعة واحدة</span> فقط.
            </p>

            {/* رسالة الخطأ */}
            {sendError && (
              <p
                className="text-sm rounded-lg p-3 mb-4"
                style={{
                  background: "oklch(0.65 0.22 25 / 15%)",
                  color:      "oklch(0.65 0.22 25)",
                  border:     "1px solid oklch(0.65 0.22 25 / 30%)",
                }}
              >
                {sendError}
              </p>
            )}

            {/* الأزرار */}
            <div className="flex gap-3">
              <Button
                onClick={handleSendReset}
                disabled={sending}
                className="flex-1 font-semibold h-10"
                style={{
                  background: "var(--gold-muted)",
                  color:      "var(--gold)",
                  border:     "1px solid oklch(0.85 0.16 85 / 40%)",
                }}
              >
                {sending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Send className="w-4 h-4 ml-1.5" /> إرسال الرابط</>
                }
              </Button>
              <Button
                onClick={() => setConfirmModal(null)}
                disabled={sending}
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

      {/* ==========================================
          Modal النجاح — تأكيد الإرسال
          ========================================== */}
      {successEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(0.65 0.18 145 / 15%)" }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: "oklch(0.72 0.2 145)" }} />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">تم إرسال الرابط!</h2>

            <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>
              تم إرسال رابط إعادة تعيين كلمة المرور إلى
            </p>
            <p
              className="text-sm font-mono font-semibold mb-4"
              style={{ color: "var(--cyan)", direction: "ltr" }}
            >
              {successEmail}
            </p>

            <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>
              الرابط صالح لمدة ساعة — إذا لم يجده في الوارد يبحث في Spam
            </p>

            <Button
              onClick={() => setSuccessEmail(null)}
              className="w-full font-semibold h-10"
              style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
            >
              حسناً
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
