"use client";
// تحديد إن الصفحة دي Client Component (عشان فيها useState وتفاعل)

// استيراد useState لإدارة حالة الفورم
import { useState } from "react";

// استيراد useSession لجلب بيانات المدرب المسجل دخوله
import { useSession } from "next-auth/react";

// استيراد الأيقونات
import { Loader2, Save, Mail, Lock, Eye, EyeOff } from "lucide-react";

// استيراد مكونات shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ==========================================
// صفحة إعدادات المدرب
// المدرب يقدر يغيّر إيميله وباسورده من هنا
// ==========================================
export default function CoachSettingsPage() {

  // جلب بيانات المدرب المسجل دخوله من الـ Session
  const { data: session } = useSession();

  // ==========================================
  // حالة تغيير الإيميل
  // ==========================================
  const [newEmail, setNewEmail] = useState("");           // الإيميل الجديد
  const [emailPassword, setEmailPassword] = useState(""); // الباسورد الحالي للتحقق
  const [emailLoading, setEmailLoading] = useState(false); // حالة الإرسال
  const [emailError, setEmailError] = useState<string | null>(null);   // رسالة الخطأ
  const [emailSuccess, setEmailSuccess] = useState(false); // حالة النجاح

  // ==========================================
  // حالة تغيير الباسورد
  // ==========================================
  const [currentPassword, setCurrentPassword] = useState("");  // الباسورد الحالي
  const [newPassword, setNewPassword] = useState("");           // الباسورد الجديد
  const [confirmPassword, setConfirmPassword] = useState("");   // تأكيد الباسورد الجديد
  const [passwordLoading, setPasswordLoading] = useState(false); // حالة الإرسال
  const [passwordError, setPasswordError] = useState<string | null>(null);   // رسالة الخطأ
  const [passwordSuccess, setPasswordSuccess] = useState(false); // حالة النجاح

  // ==========================================
  // حالة إظهار/إخفاء الباسوردات
  // ==========================================
  const [showCurrentPw, setShowCurrentPw] = useState(false); // إظهار الباسورد الحالي
  const [showNewPw, setShowNewPw] = useState(false);          // إظهار الباسورد الجديد
  const [showConfirmPw, setShowConfirmPw] = useState(false);  // إظهار تأكيد الباسورد

  // ==========================================
  // دالة تغيير الإيميل
  // ==========================================
  const handleEmailChange = async () => {

    // التحقق من ملء الحقول
    if (!newEmail.trim() || !emailPassword.trim()) {
      setEmailError("يرجى ملء جميع الحقول");
      return;
    }

    // التحقق من صيغة الإيميل بـ regex صحيح
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setEmailError("البريد الإلكتروني غير صحيح");
      return;
    }

    setEmailLoading(true);  // تفعيل حالة التحميل
    setEmailError(null);    // مسح الأخطاء السابقة
    setEmailSuccess(false); // مسح حالة النجاح السابقة

    // إرسال طلب تغيير الإيميل للـ API
    const res = await fetch("/api/coach/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "email",               // نوع التغيير = إيميل
        newEmail: newEmail.trim(),   // الإيميل الجديد
        currentPassword: emailPassword, // الباسورد الحالي للتحقق من الهوية
      }),
    });

    setEmailLoading(false); // إيقاف حالة التحميل

    // لو فيه خطأ — عرضه
    if (!res.ok) {
      const data = await res.json();
      setEmailError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // نجاح — مسح الحقول وعرض رسالة النجاح
    setNewEmail("");
    setEmailPassword("");
    setEmailSuccess(true);
  };

  // ==========================================
  // دالة تغيير الباسورد
  // ==========================================
  const handlePasswordChange = async () => {

    // التحقق من ملء الحقول
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("يرجى ملء جميع الحقول");
      return;
    }

    // التحقق من طول الباسورد الجديد
    if (newPassword.length < 8) {
      setPasswordError("كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    // التحقق من تطابق الباسورد الجديد مع التأكيد
    if (newPassword !== confirmPassword) {
      setPasswordError("كلمة السر الجديدة وتأكيدها غير متطابقين");
      return;
    }

    // منع استخدام نفس الباسورد القديم
    if (currentPassword === newPassword) {
      setPasswordError("كلمة السر الجديدة يجب أن تختلف عن الحالية");
      return;
    }

    setPasswordLoading(true);  // تفعيل حالة التحميل
    setPasswordError(null);    // مسح الأخطاء السابقة
    setPasswordSuccess(false); // مسح حالة النجاح السابقة

    // إرسال طلب تغيير الباسورد للـ API
    const res = await fetch("/api/coach/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password",              // نوع التغيير = باسورد
        currentPassword,              // الباسورد الحالي للتحقق من الهوية
        newPassword,                  // الباسورد الجديد
      }),
    });

    setPasswordLoading(false); // إيقاف حالة التحميل

    // لو فيه خطأ — عرضه
    if (!res.ok) {
      const data = await res.json();
      setPasswordError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // نجاح — مسح الحقول وعرض رسالة النجاح
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSuccess(true);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">الإعدادات الشخصية</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          غيّر بريدك الإلكتروني أو كلمة سرك
        </p>
      </div>

      {/* ==========================================
          بطاقة تغيير الإيميل
          ========================================== */}
      <Card className="mb-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" style={{ color: "var(--cyan)" }} />
            <h2 className="text-base font-semibold text-white">تغيير البريد الإلكتروني</h2>
          </div>

          {/* عرض الإيميل الحالي */}
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            الحالي:
            <span className="font-mono mr-1" style={{ color: "var(--cyan)", direction: "ltr" }}>
              {session?.user?.email ?? "..."}
            </span>
          </p>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* حقل الإيميل الجديد */}
          <div className="space-y-1.5">
            <Label className="text-white">البريد الإلكتروني الجديد</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)} // تحديث الإيميل الجديد
              className="bg-secondary border-border text-white placeholder:text-muted-foreground"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>

          {/* حقل الباسورد الحالي للتحقق */}
          <div className="space-y-1.5">
            <Label className="text-white">كلمة السر الحالية (للتأكيد)</Label>
            <div className="relative">
              <Input
                type={showCurrentPw ? "text" : "password"} // إظهار أو إخفاء حسب الحالة
                placeholder="أدخل كلمة سرك الحالية"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className="bg-secondary border-border text-white placeholder:text-muted-foreground pl-10"
                style={{ direction: "ltr", textAlign: "left" }}
              />
              {/* زرار إظهار/إخفاء الباسورد */}
              <button
                type="button"
                onClick={() => setShowCurrentPw((p) => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                {showCurrentPw
                  ? <EyeOff className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  : <Eye className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                }
              </button>
            </div>
          </div>

          {/* رسالة الخطأ */}
          {emailError && (
            <p className="text-sm rounded-lg p-3"
              style={{ background: "oklch(0.65 0.22 25 / 15%)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.65 0.22 25 / 30%)" }}>
              {emailError}
            </p>
          )}

          {/* رسالة النجاح */}
          {emailSuccess && (
            <p className="text-sm rounded-lg p-3"
              style={{ background: "oklch(0.65 0.18 145 / 15%)", color: "oklch(0.72 0.2 145)", border: "1px solid oklch(0.65 0.18 145 / 30%)" }}>
              ✓ تم تغيير البريد الإلكتروني بنجاح — سجّل دخولك مجدداً
            </p>
          )}

          {/* زرار الحفظ */}
          <Button
            onClick={handleEmailChange}
            disabled={emailLoading}
            className="flex items-center gap-2 h-10 font-semibold"
            style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
          >
            {emailLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Save className="w-4 h-4" /> حفظ البريد الجديد</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* ==========================================
          بطاقة تغيير الباسورد
          ========================================== */}
      <Card style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" style={{ color: "var(--cyan)" }} />
            <h2 className="text-base font-semibold text-white">تغيير كلمة السر</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* حقل الباسورد الحالي */}
          <div className="space-y-1.5">
            <Label className="text-white">كلمة السر الحالية</Label>
            <div className="relative">
              <Input
                type={showCurrentPw ? "text" : "password"}
                placeholder="كلمة سرك الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-secondary border-border text-white placeholder:text-muted-foreground pl-10"
                style={{ direction: "ltr", textAlign: "left" }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((p) => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                {showCurrentPw
                  ? <EyeOff className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  : <Eye className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                }
              </button>
            </div>
          </div>

          {/* حقل الباسورد الجديد */}
          <div className="space-y-1.5">
            <Label className="text-white">كلمة السر الجديدة</Label>
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                placeholder="8 أحرف على الأقل"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary border-border text-white placeholder:text-muted-foreground pl-10"
                style={{ direction: "ltr", textAlign: "left" }}
              />
              <button
                type="button"
                onClick={() => setShowNewPw((p) => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                {showNewPw
                  ? <EyeOff className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  : <Eye className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                }
              </button>
            </div>
          </div>

          {/* حقل تأكيد الباسورد الجديد */}
          <div className="space-y-1.5">
            <Label className="text-white">تأكيد كلمة السر الجديدة</Label>
            <div className="relative">
              <Input
                type={showConfirmPw ? "text" : "password"}
                placeholder="أعد كتابة كلمة السر الجديدة"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary border-border text-white placeholder:text-muted-foreground pl-10"
                style={{ direction: "ltr", textAlign: "left" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((p) => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPw
                  ? <EyeOff className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  : <Eye className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                }
              </button>
            </div>
          </div>

          {/* رسالة الخطأ */}
          {passwordError && (
            <p className="text-sm rounded-lg p-3"
              style={{ background: "oklch(0.65 0.22 25 / 15%)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.65 0.22 25 / 30%)" }}>
              {passwordError}
            </p>
          )}

          {/* رسالة النجاح */}
          {passwordSuccess && (
            <p className="text-sm rounded-lg p-3"
              style={{ background: "oklch(0.65 0.18 145 / 15%)", color: "oklch(0.72 0.2 145)", border: "1px solid oklch(0.65 0.18 145 / 30%)" }}>
              ✓ تم تغيير كلمة السر بنجاح
            </p>
          )}

          {/* زرار الحفظ */}
          <Button
            onClick={handlePasswordChange}
            disabled={passwordLoading}
            className="flex items-center gap-2 h-10 font-semibold"
            style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
          >
            {passwordLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Save className="w-4 h-4" /> حفظ كلمة السر الجديدة</>
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
