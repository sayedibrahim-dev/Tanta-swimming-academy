// ==========================================
// Resend Client — إرسال الإيميلات
//
// ليه lazy وليس مباشر؟
// لأن Next.js بيحاول يعمل evaluate للـ modules وقت الـ Build
// وفي الـ Build مفيش RESEND_API_KEY فكان بيرمي error
// الحل: نأخّر إنشاء الـ instance لحد ما تيجي طلب فعلي (runtime)
// ==========================================
import { Resend } from "resend";

let _instance: Resend | null = null;

// دالة تعيد الـ instance — تنشئه أول مرة بس
export function getResendClient(): Resend {
  if (!_instance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY غير مضبوط في environment variables");
    _instance = new Resend(key);
  }
  return _instance;
}

// ==========================================
// الإيميل المُرسَل منه
// - في التطوير: onboarding@resend.dev (لا يحتاج domain)
// - في الإنتاج: استبدله بإيميل يناسب domain الأكاديمية
//   مثال: noreply@tanta-swimming.com
// ==========================================
export const FROM_EMAIL = "أكاديمية طنطا للسباحة <onboarding@resend.dev>";
