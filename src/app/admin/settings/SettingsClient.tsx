"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsClient() {

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // إظهار/إخفاء كلمات السر
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // التحقق من تطابق كلمة المرور الجديدة
    if (newPassword !== confirmPassword) {
      setError("كلمة المرور الجديدة وتأكيدها غير متطابقين");
      return;
    }

    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ، يرجى المحاولة مجدداً");
      return;
    }

    // نجاح — نمسح الحقول
    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-md">
      <div
        className="rounded-2xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* رأس البطاقة */}
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

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* كلمة المرور الحالية */}
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              كلمة المرور الحالية
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white pr-10"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* كلمة المرور الجديدة */}
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="8 أحرف على الأقل"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white pr-10"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white pr-10"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div
              className="flex items-center gap-2 text-sm rounded-xl p-3"
              style={{
                background: "oklch(0.65 0.22 25 / 15%)",
                border: "1px solid oklch(0.65 0.22 25 / 30%)",
                color: "oklch(0.65 0.22 25)",
              }}
            >
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* رسالة النجاح */}
          {success && (
            <div
              className="flex items-center gap-2 text-sm rounded-xl p-3"
              style={{
                background: "oklch(0.65 0.18 145 / 15%)",
                border: "1px solid oklch(0.65 0.18 145 / 30%)",
                color: "oklch(0.72 0.2 145)",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              تم تغيير كلمة المرور بنجاح ✓
            </div>
          )}

          {/* زرار الحفظ */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full font-semibold h-11 mt-2"
            style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "حفظ كلمة المرور الجديدة"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
