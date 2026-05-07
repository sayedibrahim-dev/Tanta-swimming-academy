"use client";

import { useState } from "react";
import {
  KeyRound, Eye, EyeOff, Loader2,
  CheckCircle2, X, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ==========================================
// مكوّن مشترك لحقل كلمة المرور مع زرار الإظهار
// ==========================================
function PasswordField({
  label,
  value,
  onChange,
  placeholder = "••••••••",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white pr-10"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted-foreground)" }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// بطاقة رسالة (نجاح أو خطأ)
// ==========================================
function Message({ type, text }: { type: "success" | "error"; text: string }) {
  const isSuccess = type === "success";
  return (
    <div
      className="flex items-center gap-2 text-sm rounded-xl p-3"
      style={{
        background: isSuccess ? "oklch(0.65 0.18 145 / 15%)" : "oklch(0.65 0.22 25 / 15%)",
        border: `1px solid ${isSuccess ? "oklch(0.65 0.18 145 / 30%)" : "oklch(0.65 0.22 25 / 30%)"}`,
        color: isSuccess ? "oklch(0.72 0.2 145)" : "oklch(0.65 0.22 25)",
      }}
    >
      {isSuccess
        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        : <X className="w-4 h-4 flex-shrink-0" />
      }
      {text}
    </div>
  );
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function SettingsClient() {

  // ===== حالة تغيير كلمة المرور =====
  const [curPass,  setCurPass]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confPass, setConfPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg,     setPassMsg]     = useState<{ type: "success"|"error"; text: string } | null>(null);

  // ===== حالة تغيير البريد =====
  const [newEmail,      setNewEmail]      = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading,  setEmailLoading]  = useState(false);
  const [emailMsg,      setEmailMsg]      = useState<{ type: "success"|"error"; text: string } | null>(null);

  // ==========================================
  // تغيير كلمة المرور
  // ==========================================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPass !== confPass) {
      setPassMsg({ type: "error", text: "كلمة المرور الجديدة وتأكيدها غير متطابقين" });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ type: "error", text: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
      return;
    }

    setPassLoading(true);
    const res = await fetch("/api/admin/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }),
    });
    setPassLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setPassMsg({ type: "error", text: data.error ?? "حدث خطأ" });
      return;
    }

    setPassMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح ✓" });
    setCurPass(""); setNewPass(""); setConfPass("");
  };

  // ==========================================
  // تغيير البريد الإلكتروني
  // ==========================================
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);

    setEmailLoading(true);
    const res = await fetch("/api/admin/settings/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
    });
    setEmailLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setEmailMsg({ type: "error", text: data.error ?? "حدث خطأ" });
      return;
    }

    setEmailMsg({ type: "success", text: "تم تغيير البريد الإلكتروني بنجاح ✓ — سجّل دخولك بالبريد الجديد" });
    setNewEmail(""); setEmailPassword("");
  };

  return (
    <div className="max-w-md space-y-6">

      {/* ==========================================
          بطاقة تغيير كلمة المرور
          ========================================== */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--cyan-muted)" }}
          >
            <KeyRound className="w-5 h-5" style={{ color: "var(--cyan)" }} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">تغيير كلمة المرور</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              أدخل كلمة المرور الحالية ثم الجديدة
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <PasswordField
            label="كلمة المرور الحالية"
            value={curPass}
            onChange={setCurPass}
          />
          <PasswordField
            label="كلمة المرور الجديدة"
            value={newPass}
            onChange={setNewPass}
            placeholder="8 أحرف على الأقل"
          />
          <PasswordField
            label="تأكيد كلمة المرور الجديدة"
            value={confPass}
            onChange={setConfPass}
          />

          {passMsg && <Message type={passMsg.type} text={passMsg.text} />}

          <Button
            type="submit"
            disabled={passLoading}
            className="w-full font-semibold h-11 mt-2"
            style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
          >
            {passLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : "حفظ كلمة المرور الجديدة"
            }
          </Button>
        </form>
      </div>

      {/* ==========================================
          بطاقة تغيير البريد الإلكتروني
          ========================================== */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gold-muted)" }}
          >
            <Mail className="w-5 h-5" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">تغيير البريد الإلكتروني</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              يلزم تأكيد كلمة المرور للتغيير
            </p>
          </div>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">

          {/* البريد الجديد */}
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              البريد الإلكتروني الجديد
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                outline: "none",
                direction: "ltr",
                textAlign: "right",
              }}
            />
          </div>

          {/* تأكيد كلمة المرور */}
          <PasswordField
            label="كلمة المرور للتأكيد"
            value={emailPassword}
            onChange={setEmailPassword}
          />

          {emailMsg && <Message type={emailMsg.type} text={emailMsg.text} />}

          <Button
            type="submit"
            disabled={emailLoading}
            className="w-full font-semibold h-11 mt-2"
            style={{
              background: "var(--gold-muted)",
              color: "var(--gold)",
              border: "1px solid oklch(0.85 0.16 85 / 40%)",
            }}
          >
            {emailLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : "حفظ البريد الجديد"
            }
          </Button>
        </form>
      </div>

    </div>
  );
}
