"use client";

import { SessionProvider } from "next-auth/react";

// ==========================================
// مكوّن Providers - Client Component
// ==========================================
// السبب إننا محتاجين SessionProvider يلف كل التطبيق
// عشان أي مكوّن يقدر يستخدم useSession() في أي مكان.
//
// بما إن Root Layout هو Server Component ومش ينفع يحط
// "use client" فيه، بنعمل مكوّن منفصل هنا ونستدعيه من اللayout.
// ==========================================
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
