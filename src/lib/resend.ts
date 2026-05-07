// ==========================================
// Resend Client — إرسال الإيميلات
// الـ instance بيتعمل مرة واحدة ويتشارك في كل الـ API routes
// ==========================================
import { Resend } from "resend";

// إنشاء الـ client باستخدام الـ API Key من الـ environment
export const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// الإيميل المُرسَل منه
// - في التطوير: onboarding@resend.dev (لا يحتاج domain)
// - في الإنتاج: استبدله بإيميل يناسب domain الأكاديمية
//   مثال: noreply@tanat-swimming.com
// ==========================================
export const FROM_EMAIL = "أكاديمية طنطا للسباحة <onboarding@resend.dev>";
