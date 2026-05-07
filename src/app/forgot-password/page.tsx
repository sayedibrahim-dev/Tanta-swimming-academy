"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

const GOLD       = "rgba(212, 175, 55, 1)";
const GOLD_20    = "rgba(212, 175, 55, 0.20)";
const GOLD_LIGHT = "rgba(245, 225, 120, 1)";
const GOLD_DARK  = "rgba(139, 105, 20, 1)";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ، حاول مرة أخرى");
      return;
    }

    setDone(true);
  };

  return (
    <div style={{
      minHeight:      "100vh",
      background:     "linear-gradient(145deg, #060D1E 0%, #0A1628 35%, #0E1F3D 65%, #070F22 100%)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "1rem",
      position:       "relative",
      overflow:       "hidden",
    }}>
      {/* خلفية ذهبية */}
      <div style={{ position:"absolute", top:"-15%", right:"-10%", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 68%)", filter:"blur(30px)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:"420px", position:"relative", zIndex:10 }}>

        {/* اللوجو */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ display:"inline-flex", padding:"4px", borderRadius:"50%", background:`linear-gradient(135deg, ${GOLD_DARK}, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_LIGHT}, ${GOLD_DARK})` }}>
            <div style={{ borderRadius:"50%", overflow:"hidden", background:"#0A1628", width:"80px", height:"80px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Image src="/tanat-logo.png" alt="أكاديمية طنطا" width={70} height={70} className="object-contain" priority />
            </div>
          </div>
          <p style={{ color:"white", fontWeight:"900", fontSize:"1.4rem", marginTop:"1rem", marginBottom:"0.25rem" }}>
            أكاديمية طنطا للسباحة
          </p>
          <p style={{ color:GOLD, fontSize:"0.75rem", letterSpacing:"0.15em", opacity:0.85 }}>
            استعادة كلمة المرور
          </p>
        </div>

        {/* البطاقة */}
        <div style={{
          background:           "rgba(10, 22, 50, 0.52)",
          backdropFilter:       "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border:               `1px solid ${GOLD_20}`,
          borderRadius:         "1.5rem",
          padding:              "2rem",
          boxShadow:            "0 8px 40px rgba(0,0,0,0.55)",
        }}>

          {/* شاشة النجاح */}
          {done ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"oklch(0.65 0.18 145 / 15%)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.25rem" }}>
                <CheckCircle2 style={{ width:"32px", height:"32px", color:"oklch(0.72 0.2 145)" }} />
              </div>
              <h2 style={{ color:"white", fontWeight:"800", fontSize:"1.15rem", marginBottom:"0.75rem" }}>
                تم إرسال الرابط!
              </h2>
              <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.875rem", marginBottom:"0.5rem", lineHeight:"1.7" }}>
                إذا كان البريد مسجلاً لدينا، ستجد رابط إعادة التعيين في صندوق الوارد.
              </p>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.8rem", marginBottom:"1.75rem" }}>
                لم تجده؟ تحقق من مجلد Spam
              </p>
              <a href="/login" style={{
                display:"inline-flex", alignItems:"center", gap:"0.4rem",
                color:GOLD, fontSize:"0.875rem", fontWeight:"600", textDecoration:"none",
              }}>
                <ArrowRight style={{ width:"16px", height:"16px" }} />
                العودة لتسجيل الدخول
              </a>
            </div>
          ) : (
            <>
              <h2 style={{ textAlign:"center", color:"white", fontWeight:"700", fontSize:"1.15rem", marginBottom:"0.5rem" }}>
                نسيت كلمة المرور؟
              </h2>
              <p style={{ textAlign:"center", color:"rgba(255,255,255,0.45)", fontSize:"0.85rem", marginBottom:"1.75rem" }}>
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
              </p>

              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  <label style={{ color:"rgba(255,255,255,0.85)", fontSize:"0.875rem", fontWeight:"600" }}>
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    autoComplete="email"
                    required
                    className="input-gold"
                    style={{ height:"46px", borderRadius:"0.75rem", padding:"0 1rem", fontSize:"0.9rem", direction:"ltr", textAlign:"left", width:"100%", boxSizing:"border-box" }}
                  />
                </div>

                {error && (
                  <div style={{ borderRadius:"0.75rem", padding:"0.75rem 1rem", fontSize:"0.875rem", background:"oklch(0.65 0.22 25 / 12%)", border:"1px solid oklch(0.65 0.22 25 / 30%)", color:"oklch(0.72 0.22 25)" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold"
                  style={{ height:"50px", width:"100%", fontSize:"1rem", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", border:"none", marginTop:"0.25rem" }}
                >
                  {loading
                    ? <><Loader2 style={{ width:"18px", height:"18px", animation:"spin 1s linear infinite" }} /> جاري الإرسال...</>
                    : "إرسال رابط الاستعادة"
                  }
                </button>

              </form>

              <div style={{ marginTop:"1.5rem", textAlign:"center" }}>
                <a href="/login" style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.4)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"0.4rem" }}>
                  <ArrowRight style={{ width:"14px", height:"14px" }} />
                  العودة لتسجيل الدخول
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
