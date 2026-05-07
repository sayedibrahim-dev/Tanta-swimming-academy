"use client";

// استيراد useState لإدارة الحالة التفاعلية
import { useState } from "react";

// استيراد الأيقونات المستخدمة
import {
  User,          // أيقونة ولي الأمر
  Phone,         // أيقونة التليفون
  Mail,          // أيقونة الإيميل
  Users,         // أيقونة عدد الأبناء
  KeyRound,      // أيقونة كلمة المرور
  X,             // أيقونة إغلاق الـ modal
  Loader2,       // أيقونة التحميل
  Eye,           // أيقونة إظهار الباسورد
  EyeOff,        // أيقونة إخفاء الباسورد
  CheckCircle2,  // أيقونة النجاح
  Copy,          // أيقونة النسخ
} from "lucide-react";

// استيراد مكونات shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// استيراد نوع بيانات ولي الأمر من صفحة السيرفر
import type { ParentItem } from "./page";

// ==========================================
// Props المكوّن الرئيسي
// ==========================================
interface ParentsClientProps {
  initialParents: ParentItem[]; // قائمة أولياء الأمور من السيرفر
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function ParentsClient({ initialParents }: ParentsClientProps) {

  // قائمة أولياء الأمور — ثابتة (مفيش إضافة أو حذف من هنا)
  const parents = initialParents;

  // حالة modal إعادة تعيين كلمة المرور
  const [resetModal, setResetModal] = useState<{
    parentId: string; // معرف ولي الأمر
    name: string;     // اسمه للعرض في الـ modal
    email: string;    // إيميله للعرض (عشان الأدمن يبعتهوله)
  } | null>(null);

  // كلمة المرور الجديدة اللي بيكتبها الأدمن
  const [newPassword, setNewPassword] = useState("");

  // إظهار أو إخفاء كلمة المرور
  const [showPassword, setShowPassword] = useState(false);

  // حالة التحميل أثناء الإرسال
  const [submitting, setSubmitting] = useState(false);

  // رسالة الخطأ
  const [resetError, setResetError] = useState<string | null>(null);

  // modal النجاح — بيعرض كلمة المرور الجديدة مرة واحدة للأدمن
  const [successModal, setSuccessModal] = useState<{
    name: string;     // اسم ولي الأمر
    email: string;    // إيميله
    password: string; // كلمة المرور الجديدة
  } | null>(null);

  // حالة نسخ كلمة المرور في modal النجاح
  const [copied, setCopied] = useState(false);

  // إظهار/إخفاء كلمة المرور في modal النجاح
  const [showSuccessPassword, setShowSuccessPassword] = useState(false);

  // ==========================================
  // دالة فتح modal إعادة التعيين
  // ==========================================
  const openResetModal = (parent: ParentItem) => {
    setNewPassword("");     // مسح أي كلمة مرور سابقة
    setShowPassword(false); // إخفاء الباسورد افتراضياً
    setResetError(null);    // مسح الأخطاء
    setResetModal({
      parentId: parent.id,
      name:     parent.name,
      email:    parent.user?.email ?? "",
    });
  };

  // ==========================================
  // دالة نسخ كلمة المرور للـ clipboard
  // ==========================================
  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password); // نسخ للـ clipboard
    setCopied(true);                                // تفعيل حالة "تم النسخ"
    setTimeout(() => setCopied(false), 2000);       // إعادة الحالة بعد ثانيتين
  };

  // ==========================================
  // دالة إرسال طلب إعادة تعيين كلمة المرور
  // ==========================================
  const handleReset = async () => {
    if (!resetModal) return;

    // التحقق من إدخال كلمة مرور
    if (!newPassword.trim()) {
      setResetError("يرجى إدخال كلمة المرور الجديدة");
      return;
    }

    setSubmitting(true); // تفعيل حالة التحميل
    setResetError(null); // مسح الأخطاء

    // إرسال طلب إعادة التعيين للـ API
    const res = await fetch(`/api/admin/parents/${resetModal.parentId}/reset-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPassword.trim() }), // إرسال كلمة المرور الجديدة
    });

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setResetError(data.error ?? "حدث خطأ أثناء إعادة التعيين");
      return;
    }

    // نجاح — أغلق modal الإدخال وافتح modal النجاح
    const savedPassword = newPassword.trim(); // احفظ كلمة المرور قبل مسحها
    setResetModal(null);                       // إغلاق modal الإدخال
    setNewPassword("");                         // مسح الحقل
    setShowSuccessPassword(false);             // إخفاء الباسورد افتراضياً
    setCopied(false);                           // إعادة حالة النسخ
    setSuccessModal({
      name:     resetModal.name,
      email:    resetModal.email,
      password: savedPassword, // كلمة المرور الجديدة للعرض للأدمن
    });
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

      {/* ==========================================
          شبكة بطاقات أولياء الأمور
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {parents.map((parent) => {

          // عدد أبناء ولي الأمر
          const swimmerCount = parent.swimmers?.length ?? 0;

          return (
            <div
              key={parent.id}
              className="rounded-2xl p-5 border flex flex-col gap-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* رأس البطاقة — الأيقونة والاسم */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--cyan-muted)" }}
                >
                  <User className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                </div>
                <div className="min-w-0">
                  {/* اسم ولي الأمر */}
                  <p className="font-semibold text-white truncate">{parent.name}</p>
                  {/* عدد الأبناء */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--cyan-muted)", color: "var(--cyan)" }}
                  >
                    {swimmerCount} {swimmerCount === 1 ? "سباح" : "سباحون"}
                  </span>
                </div>
              </div>

              {/* تفاصيل ولي الأمر */}
              <div className="space-y-2">

                {/* الإيميل */}
                {parent.user?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    />
                    <span
                      className="truncate font-mono text-xs"
                      style={{ color: "var(--muted-foreground)", direction: "ltr" }}
                    >
                      {parent.user.email}
                    </span>
                  </div>
                )}

                {/* التليفون */}
                {parent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    />
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--muted-foreground)", direction: "ltr" }}
                    >
                      {parent.phone}
                    </span>
                  </div>
                )}

                {/* أسماء الأبناء */}
                {swimmerCount > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users
                      className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    />
                    <span style={{ color: "var(--muted-foreground)" }} className="text-xs">
                      {parent.swimmers.map((s) => s.name).join("، ")}
                    </span>
                  </div>
                )}
              </div>

              {/* زرار إعادة تعيين كلمة المرور */}
              <button
                onClick={() => openResetModal(parent)}
                className="mt-auto flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{ background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid oklch(0.85 0.16 85 / 30%)" }}
              >
                <KeyRound className="w-3.5 h-3.5" />
                إعادة تعيين كلمة المرور
              </button>
            </div>
          );
        })}
      </div>

      {/* ==========================================
          Modal إعادة تعيين كلمة المرور
          ========================================== */}
      {resetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setResetModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" style={{ color: "var(--gold)" }} />
                <h2 className="text-lg font-semibold text-white">إعادة تعيين كلمة المرور</h2>
              </div>
              {/* زرار إغلاق */}
              <button
                onClick={() => setResetModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* اسم ولي الأمر */}
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              تعيين كلمة مرور جديدة لـ
              <span className="text-white font-semibold mx-1">{resetModal.name}</span>
            </p>

            {/* حقل كلمة المرور الجديدة */}
            <div className="space-y-1.5 mb-4">
              <Label className="text-white">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} // تحديث كلمة المرور عند الكتابة
                  placeholder="8 أحرف على الأقل"
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground pr-10"
                />
                {/* زرار إظهار/إخفاء كلمة المرور */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            {resetError && (
              <p
                className="text-sm rounded-lg p-3 mb-4"
                style={{
                  background: "oklch(0.65 0.22 25 / 15%)",
                  color: "oklch(0.65 0.22 25)",
                  border: "1px solid oklch(0.65 0.22 25 / 30%)",
                }}
              >
                {resetError}
              </p>
            )}

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                disabled={submitting}
                className="flex-1 font-semibold h-10"
                style={{
                  background: "var(--gold-muted)",
                  color: "var(--gold)",
                  border: "1px solid oklch(0.85 0.16 85 / 40%)",
                }}
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "حفظ كلمة المرور الجديدة"
                }
              </Button>
              <Button
                onClick={() => setResetModal(null)}
                disabled={submitting}
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
          Modal النجاح — عرض كلمة المرور الجديدة للأدمن
          ========================================== */}
      {successModal && (
        // الخلفية مش قابلة للإغلاق — عشان الأدمن يأخد كلمة المرور الأول
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.65 0.18 145 / 15%)" }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: "oklch(0.72 0.2 145)" }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">تم إعادة التعيين بنجاح</h2>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {successModal.name}
                </p>
              </div>
            </div>

            {/* تعليمات للأدمن */}
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              ابعت بيانات الدخول دي لولي الأمر عبر التليفون أو الواتساب
            </p>

            {/* بيانات الدخول */}
            <div
              className="rounded-xl p-4 space-y-3 mb-5"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
            >
              {/* الإيميل */}
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  البريد الإلكتروني
                </p>
                <p className="text-sm font-mono text-white" style={{ direction: "ltr" }}>
                  {successModal.email}
                </p>
              </div>

              {/* كلمة المرور الجديدة */}
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  كلمة المرور الجديدة
                </p>
                <div className="flex items-center gap-2">
                  {/* كلمة المرور — مخفية أو ظاهرة حسب الحالة */}
                  <p
                    className="flex-1 text-sm font-mono"
                    style={{ color: "var(--gold)", direction: "ltr" }}
                  >
                    {showSuccessPassword
                      ? successModal.password                              // عرض كنص عادي
                      : "•".repeat(successModal.password.length)          // إخفاء بنقاط
                    }
                  </p>

                  {/* زرار إظهار/إخفاء */}
                  <button
                    onClick={() => setShowSuccessPassword((p) => !p)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
                  >
                    {showSuccessPassword
                      ? <EyeOff className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                      : <Eye    className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                    }
                  </button>

                  {/* زرار النسخ */}
                  <button
                    onClick={() => copyPassword(successModal.password)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
                    title="نسخ كلمة المرور"
                  >
                    {copied
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.72 0.2 145)" }} />
                      : <Copy         className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* زرار إغلاق modal النجاح */}
            <Button
              onClick={() => setSuccessModal(null)}
              className="w-full font-semibold h-10"
              style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
            >
              حفظت البيانات، إغلاق
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
