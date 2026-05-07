"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react"; // للتحقق من بيانات الدخول
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation"; // لقراءة query params من الـ URL

// ==========================================
// قواعد التحقق من صحة النموذج
// ==========================================
const loginSchema = z.object({
  email:    z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// ألوان الهوية الذهبية — ثوابت للاستخدام المتكرر
// ==========================================
const GOLD        = "rgba(212, 175, 55, 1)";    // الذهبي الأساسي
const GOLD_20     = "rgba(212, 175, 55, 0.20)"; // ذهبي شفاف للحدود
const GOLD_35     = "rgba(212, 175, 55, 0.35)"; // ذهبي للحدود عند التركيز
const GOLD_LIGHT  = "rgba(245, 225, 120, 1)";   // ذهبي فاتح لتدرج البادج
const GOLD_DARK   = "rgba(139, 105, 20, 1)";    // ذهبي غامق لتدرج البادج

// ==========================================
// مكوّن صغير منفصل لقراءة query params
// useSearchParams لازم يكون جوّا Suspense في Next.js 15+
// وضعناه في component منفصل عشان نقدر نلفّه بـ Suspense
// ==========================================
function RegisteredBanner() {
  const searchParams   = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  if (!justRegistered) return null; // مش جاي من صفحة التسجيل — متعرضش حاجة

  return (
    <div style={{
      display:      "flex",
      alignItems:   "center",
      gap:          "0.625rem",
      borderRadius: "0.75rem",
      padding:      "0.875rem 1rem",
      marginBottom: "1.5rem",
      background:   "oklch(0.65 0.18 145 / 12%)",
      border:       "1px solid oklch(0.65 0.18 145 / 35%)",
    }}>
      <CheckCircle2 style={{ width: "18px", height: "18px", color: "oklch(0.72 0.2 145)", flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: "0.875rem", fontWeight: "700", color: "oklch(0.72 0.2 145)", marginBottom: "0.125rem" }}>
          تم إنشاء حسابك بنجاح!
        </p>
        <p style={{ fontSize: "0.78rem", color: "oklch(0.65 0.18 145 / 80%)" }}>
          سجّل دخولك الآن باستخدام بياناتك
        </p>
      </div>
    </div>
  );
}

// ==========================================
// صفحة تسجيل الدخول — Luxury Imperial Navy & Gold
// ==========================================
function LoginForm() {
  const [error,     setError]     = useState<string | null>(null); // رسالة الخطأ العادية
  const [rateLocked, setRateLocked] = useState(false);             // هل الحساب محظور مؤقتاً؟

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // ==========================================
  // دالة تسجيل الدخول
  // ==========================================
  const onSubmit = async (data: LoginFormData) => {
    // مسح الأخطاء السابقة عند كل محاولة جديدة
    setError(null);
    setRateLocked(false);

    try {
      // استدعاء NextAuth للتحقق من الكريدنشيالز
      const result = await signIn("credentials", {
        email:    data.email,
        password: data.password,
        redirect: false,
      });

      // فشل التحقق من السيرفر
      if (!result) {
        setError("لا يوجد رد من الخادم، حاول مجدداً");
        return;
      }

      if (result.error) {
        // ==========================================
        // فحص لو الحساب محظور بسبب محاولات كثيرة
        // NextAuth بيمرر الـ Error message الحرفية في result.error
        // الـ auth.ts يرمي: throw new Error(`RATE_LIMITED:${minutes}`)
        // فبيجي هنا: result.error = "RATE_LIMITED:13"
        // ==========================================
        if (result.error.startsWith("RATE_LIMITED:")) {
          const minutes = result.error.split(":")[1]; // استخراج عدد الدقائق
          setRateLocked(true);
          setError(
            `تم تعليق الدخول مؤقتاً بسبب المحاولات المتكررة — حاول مرة أخرى بعد ${minutes} دقيقة`
          );
          return;
        }

        // كريدنشيالز غلط — رسالة عامة بدون تفاصيل (أمان)
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }

      // نجاح — التوجيه لصفحة الـ role
      if (result.ok) {
        window.location.href = "/";
        return;
      }

      // ok = false وerror = null — حالة غير متوقعة
      setError("حدث خطأ غير متوقع، حاول مجدداً");
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الاتصال وحاول مجدداً");
    }
  };

  return (
    // ==========================================
    // الخلفية — Imperial Navy العميق
    // ==========================================
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #060D1E 0%, #0A1628 35%, #0E1F3D 65%, #070F22 100%)",
        position:  "relative",
        overflow:  "hidden",
        display:   "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >

      {/* ==========================================
          كرات الإضاءة المحيطية — تعطي عمقاً للخلفية
          ========================================== */}

      {/* توهج ذهبي — أعلى اليسار */}
      <div style={{
        position:     "absolute",
        top:          "-15%",
        right:        "-10%",
        width:        "600px",
        height:       "600px",
        borderRadius: "50%",
        background:   "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 68%)",
        filter:       "blur(30px)",
        pointerEvents:"none",
      }} />

      {/* توهج كحلي — أسفل اليمين */}
      <div style={{
        position:     "absolute",
        bottom:       "-15%",
        left:         "-10%",
        width:        "500px",
        height:       "500px",
        borderRadius: "50%",
        background:   "radial-gradient(circle, rgba(80,110,255,0.10) 0%, transparent 68%)",
        filter:       "blur(40px)",
        pointerEvents:"none",
      }} />

      {/* توهج ذهبي مركزي خفيف */}
      <div style={{
        position:     "absolute",
        top:          "50%",
        left:         "50%",
        transform:    "translate(-50%, -50%)",
        width:        "800px",
        height:       "400px",
        borderRadius: "50%",
        background:   "radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 65%)",
        filter:       "blur(20px)",
        pointerEvents:"none",
      }} />

      {/* ==========================================
          المحتوى الرئيسي
          ========================================== */}
      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}>

        {/* ==========================================
            اللوجو العائم داخل الحلقة الذهبية
            ========================================== */}
        <div className="text-center mb-8">

          {/* حاوية الحركة العائمة */}
          <div className="logo-float" style={{ display: "inline-block" }}>

            {/* الحلقة الذهبية المعدنية النابضة */}
            <div
              className="logo-ring"
              style={{
                display:      "inline-flex",
                padding:      "4px",           /* سمك الحلقة الذهبية */
                borderRadius: "50%",
                background:   `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_LIGHT}, ${GOLD_DARK})`,
              }}
            >
              {/* الدائرة الداخلية — تخفي الخلفية البيضاء للوجو */}
              <div style={{
                borderRadius: "50%",
                overflow:     "hidden",
                background:   "#0A1628",       /* نفس لون خلفية الصفحة */
                width:        "100px",
                height:       "100px",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
              }}>
                <Image
                  src="/tanat-logo.png"
                  alt="نادي طنطا الرياضي"
                  width={88}
                  height={88}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

          </div>

          {/* عنوان الأكاديمية */}
          <h1 style={{
            fontSize:    "1.75rem",
            fontWeight:  "900",           /* أثقل وزن في Cairo */
            color:       "white",
            marginTop:   "1.25rem",
            marginBottom:"0.25rem",
            letterSpacing: "0.02em",
            textShadow:  "0 2px 12px rgba(0,0,0,0.5)",
            lineHeight:  "1.3",
          }}>
            أكاديمية طنطا للسباحة
          </h1>

          {/* الشعار الفرعي بالذهبي */}
          <p style={{
            fontSize:    "0.8rem",
            fontWeight:  "600",
            color:       GOLD,
            letterSpacing: "0.15em",    /* تباعد الحروف للمظهر الفخم */
            textTransform: "uppercase",
            opacity:     0.85,
          }}>
            نادي طنطا الرياضي
          </p>
        </div>

        {/* ==========================================
            بطاقة الدخول — Glassmorphism
            ========================================== */}
        <div style={{
          background:       "rgba(10, 22, 50, 0.52)",      /* زجاج كحلي شفاف */
          backdropFilter:   "blur(24px) saturate(160%)",   /* تأثير الزجاج الضبابي */
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border:           `1px solid ${GOLD_20}`,        /* حد ذهبي خفيف */
          borderRadius:     "1.5rem",                       /* حواف دائرية ناعمة */
          padding:          "2rem",
          boxShadow:        `0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(212,175,55,0.06)`,
        }}>

          {/* ==========================================
              بانر نجاح إنشاء الحساب — مستقل بـ Suspense لتفادي hydration errors
              ========================================== */}
          <Suspense fallback={null}>
            <RegisteredBanner />
          </Suspense>

          {/* عنوان النموذج */}
          <h2 style={{
            textAlign:    "center",
            color:        "white",
            fontWeight:   "700",
            fontSize:     "1.2rem",
            marginBottom: "1.75rem",
            letterSpacing: "0.03em",
          }}>
            تسجيل الدخول
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >

            {/* ==========================================
                حقل البريد الإلكتروني
                ========================================== */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", fontWeight: "600" }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                {...register("email")}
                className="input-gold"
                style={{
                  height:       "46px",
                  borderRadius: "0.75rem",
                  padding:      "0 1rem",
                  fontSize:     "0.9rem",
                  direction:    "ltr",
                  textAlign:    "left",
                  width:        "100%",
                  boxSizing:    "border-box",
                }}
              />
              {errors.email && (
                <p style={{ color: "oklch(0.65 0.22 25)", fontSize: "0.8rem" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ==========================================
                حقل كلمة المرور
                ========================================== */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", fontWeight: "600" }}>
                كلمة المرور
              </label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                className="input-gold"
                style={{
                  height:       "46px",
                  borderRadius: "0.75rem",
                  padding:      "0 1rem",
                  fontSize:     "0.9rem",
                  direction:    "ltr",
                  textAlign:    "left",
                  width:        "100%",
                  boxSizing:    "border-box",
                }}
              />
              {errors.password && (
                <p style={{ color: "oklch(0.65 0.22 25)", fontSize: "0.8rem" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ==========================================
                رسالة خطأ تسجيل الدخول
                - rateLocked = true  → برتقالي + أيقونة قفل (حظر مؤقت)
                - rateLocked = false → أحمر عادي (بيانات خاطئة)
                ========================================== */}
            {error && (
              <div style={{
                borderRadius: "0.75rem",
                padding:      "0.75rem 1rem",
                fontSize:     "0.875rem",
                // لون مختلف لحالة الحظر المؤقت مقابل الخطأ العادي
                background: rateLocked
                  ? "rgba(234, 120, 20, 0.10)"
                  : "oklch(0.65 0.22 25 / 12%)",
                border: rateLocked
                  ? "1px solid rgba(234, 120, 20, 0.35)"
                  : "1px solid oklch(0.65 0.22 25 / 30%)",
                color: rateLocked
                  ? "rgba(255, 160, 60, 1)"
                  : "oklch(0.72 0.22 25)",
                display:    "flex",
                alignItems: "flex-start",
                gap:        "0.6rem",
              }}>
                {/* أيقونة القفل للحظر المؤقت — بدونها رسالة خطأ عادية */}
                {rateLocked && (
                  <ShieldAlert style={{ width: "18px", height: "18px", flexShrink: 0, marginTop: "1px" }} />
                )}
                <span>{error}</span>
              </div>
            )}

            {/* ==========================================
                زرار الدخول الذهبي المعدني
                ========================================== */}
            <button
              type="submit"
              disabled={isSubmitting || rateLocked} // معطّل أثناء التحميل أو الحظر
              className="btn-gold"
              style={{
                height:     "50px",
                width:      "100%",
                fontSize:   "1rem",
                cursor:     (isSubmitting || rateLocked) ? "not-allowed" : "pointer",
                opacity:    (isSubmitting || rateLocked) ? 0.5 : 1,
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                gap:        "0.5rem",
                border:     "none",
                marginTop:  "0.25rem",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "دخول"
              )}
            </button>

          </form>

          {/* روابط أسفل الفورم */}
          <div style={{ marginTop: "1.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.6rem" }}>

            {/* نسيت كلمة المرور */}
            <a
              href="/forgot-password"
              style={{
                fontSize:       "0.85rem",
                color:          "rgba(255,255,255,0.4)",
                textDecoration: "none",
                transition:     "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              نسيت كلمة المرور؟
            </a>

            {/* إنشاء حساب */}
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>
              ولي أمر جديد؟{" "}
              <a
                href="/register"
                style={{
                  color:          GOLD,
                  fontWeight:     "600",
                  textDecoration: "none",
                  transition:     "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                إنشاء حساب
              </a>
            </p>
          </div>

        </div>

        {/* حقوق النشر */}
        <p style={{
          textAlign:  "center",
          marginTop:  "1.5rem",
          fontSize:   "0.75rem",
          color:      "rgba(255,255,255,0.25)",
          letterSpacing: "0.04em",
        }}>
          © {new Date().getFullYear()} أكاديمية طنطا للسباحة — جميع الحقوق محفوظة
        </p>

      </div>
    </div>
  );
}

// ==========================================
// الـ default export — يلف LoginForm بـ Suspense
// مطلوب في Next.js 15+ لأن الـ form يحتوي على Suspense داخلي
// بدون هذا، useSearchParams بيسبب hydration error ويكسر الـ form
// ==========================================
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
