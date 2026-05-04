import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Cairo } from "next/font/google"; // خط Cairo العربي الأنيق من Google Fonts

// تهيئة خط Cairo — يدعم العربية والإنجليزية بأوزان متعددة
const cairo = Cairo({
  subsets: ["arabic", "latin"],          // دعم العربية والإنجليزية
  weight: ["400", "600", "700", "900"],  // الأوزان: عادي / نصف عريض / عريض / أثقل
  variable: "--font-cairo",              // متغير CSS للاستخدام في globals.css
  display: "swap",                       // عرض النص فوراً ثم استبداله بالخط بعد التحميل
});

export const metadata: Metadata = {
  title: "أكاديمية طنطا للسباحة",
  description: "نظام إدارة أكاديمية طنطا للسباحة — نادي طنطا الرياضي",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // تطبيق متغير خط Cairo على كامل التطبيق
    <html lang="ar" dir="rtl" className={`h-full antialiased ${cairo.variable}`}>
      <body className="min-h-full flex flex-col">
        {/* SessionProvider يلف كل التطبيق عشان useSession يشتغل في أي مكوّن */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
