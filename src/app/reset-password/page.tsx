"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

// ==========================================
// قواعد التحقق
// ==========================================
const schema = z.object({
  newPassword:     z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path:    ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

// ألوان الهوية الذهبية
const GOLD       = "rgba(212, 175, 55, 1)";
const GOLD_20    = "rgba(212, 175, 55, 0.20)";
const GOLD_LIGHT = "rgba(245, 225, 120, 1)";
const GOLD_DARK  = "rgba(139, 105, 20, 1)";

// ==========================================
// المكوّن الداخلي — يقرأ الـ token من الـ URL
// ==========================================
function ResetForm() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done,        setDone]        = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // ==========================================
  // لو مفيش token في الـ URL — رسالة خطأ فوراً
  // ==========================================
  if (!token) {
    return (
      <ErrorCard message="الرابط غير صالح — تواصل مع الإدارة للحصول على رابط جديد" />
    );
  }

  // ==========================================
  // إرسال كلمة المرور الجديدة مع التوكن للـ API
  // ==========================================
  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const res = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, newPassword: data.newPassword }),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error ?? "حدث خطأ، حاول مرة أخرى");
      return;
    }

    setDone(true); // عرض شاشة النجاح
  };

  // ==========================================
  // شاشة النجاح — بعد تحديث كلمة المرور
  // ==========================================
  if (done) {
    return (
      <PageShell>
        <div style={{
          background:     "rgba(10, 22, 50, 0.52)",
          backdropFilter: "blur(24px) saturate(160%)",
          border:         `1px solid ${GOLD_20}`,
          borderRadius:   "1.5rem",
          padding:        "2.5rem 2rem",
          textAlign:      "center",
        }}>
          <div style={{
            width: "64px", height: "64px",
            borderRadius: "50%",
            background: "oklch(0.65 0.18 145 / 15%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <CheckCircle2 style={{ width: "32px", height: "32px", color: "oklch(0.72 0.2 145)" }} />
          </div>
          <h2 style={{ color: "white", fontWeight: "800", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            تم تحديث كلمة المرور!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
            يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
          </p>
          <a
            href="/login"
            style={{
              display:      "inline-block",
              background:   `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_LIGHT}, ${GOLD_DARK})`,
              color:        "#0A1628",
              fontWeight:   "800",
              fontSize:     "0.95rem",
              padding:      "12px 32px",
              borderRadius: "0.75rem",
              textDecoration: "none",
            }}
          >
            تسجيل الدخول الآن
          </a>
        </div>
      </PageShell>
    );
  }

  // ==========================================
  // نموذج تعيين كلمة المرور الجديدة
  // ==========================================
  return (
    <PageShell>
      <div style={{
        background:           "rgba(10, 22, 50, 0.52)",
        backdropFilter:       "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        border:               `1px solid ${GOLD_20}`,
        borderRadius:         "1.5rem",
        padding:              "2rem",
        boxShadow:            "0 8px 40px rgba(0,0,0,0.55)",
      }}>
        <h2 style={{
          textAlign:    "center",
          color:        "white",
          fontWeight:   "700",
          fontSize:     "1.2rem",
          marginBottom: "1.75rem",
        }}>
          تعيين كلمة مرور جديدة
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* كلمة المرور الجديدة */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", fontWeight: "600" }}>
              كلمة المرور الجديدة
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                placeholder="8 أحرف على الأقل"
                autoComplete="new-password"
                {...register("newPassword")}
                className="input-gold"
                style={{ height: "46px", borderRadius: "0.75rem", padding: "0 1rem 0 3rem", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                {showNew ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              </button>
            </div>
            {errors.newPassword && (
              <p style={{ color: "oklch(0.65 0.22 25)", fontSize: "0.8rem" }}>{errors.newPassword.message}</p>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", fontWeight: "600" }}>
              تأكيد كلمة المرور
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="أعد إدخال كلمة المرور"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className="input-gold"
                style={{ height: "46px", borderRadius: "0.75rem", padding: "0 1rem 0 3rem", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                {showConfirm ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: "oklch(0.65 0.22 25)", fontSize: "0.8rem" }}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* رسالة خطأ السيرفر */}
          {serverError && (
            <div style={{
              borderRadius: "0.75rem",
              padding:      "0.75rem 1rem",
              fontSize:     "0.875rem",
              background:   "oklch(0.65 0.22 25 / 12%)",
              border:       "1px solid oklch(0.65 0.22 25 / 30%)",
              color:        "oklch(0.72 0.22 25)",
              display:      "flex",
              alignItems:   "center",
              gap:          "0.5rem",
            }}>
              <XCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
              {serverError}
            </div>
          )}

          {/* زر الحفظ */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold"
            style={{
              height:   "50px",
              width:    "100%",
              fontSize: "1rem",
              cursor:   isSubmitting ? "not-allowed" : "pointer",
              opacity:  isSubmitting ? 0.7 : 1,
              display:  "flex",
              alignItems: "center",
              justifyContent: "center",
              gap:      "0.5rem",
              border:   "none",
              marginTop: "0.25rem",
            }}
          >
            {isSubmitting ? (
              <><Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> جاري الحفظ...</>
            ) : "حفظ كلمة المرور الجديدة"}
          </button>

        </form>
      </div>
    </PageShell>
  );
}

// ==========================================
// مكوّن مساعد — الخلفية المشتركة
// ==========================================
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight:      "100vh",
      background:     "linear-gradient(145deg, #060D1E 0%, #0A1628 35%, #0E1F3D 65%, #070F22 100%)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "1rem",
    }}>
      {/* توهج ذهبي خلفية */}
      <div style={{ position: "absolute", top: "-15%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 68%)", filter: "blur(30px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}>
        {/* اللوجو */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", padding: "4px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_LIGHT}, ${GOLD_DARK})`,
          }}>
            <div style={{ borderRadius: "50%", overflow: "hidden", background: "#0A1628", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/tanat-logo.png" alt="أكاديمية طنطا" width={70} height={70} className="object-contain" priority />
            </div>
          </div>
          <p style={{ color: "white", fontWeight: "900", fontSize: "1.4rem", marginTop: "1rem", marginBottom: "0.25rem" }}>
            أكاديمية طنطا للسباحة
          </p>
          <p style={{ color: GOLD, fontSize: "0.75rem", letterSpacing: "0.15em", opacity: 0.85 }}>
            إعادة تعيين كلمة المرور
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}

// ==========================================
// مكوّن الخطأ
// ==========================================
function ErrorCard({ message }: { message: string }) {
  return (
    <PageShell>
      <div style={{
        background:     "rgba(10, 22, 50, 0.52)",
        backdropFilter: "blur(24px)",
        border:         `1px solid ${GOLD_20}`,
        borderRadius:   "1.5rem",
        padding:        "2rem",
        textAlign:      "center",
      }}>
        <XCircle style={{ width: "48px", height: "48px", color: "oklch(0.65 0.22 25)", margin: "0 auto 1rem" }} />
        <p style={{ color: "white", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" }}>رابط غير صالح</p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{message}</p>
        <a href="/login" style={{ color: GOLD, fontSize: "0.875rem", fontWeight: "600" }}>
          العودة لتسجيل الدخول
        </a>
      </div>
    </PageShell>
  );
}

// ==========================================
// الـ default export — ملفوف بـ Suspense لأن useSearchParams
// ==========================================
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
