import { NextRequest, NextResponse } from "next/server";

// ==========================================
// Middleware — بيشتغل على كل طلب قبل ما يوصل للصفحة
// الهدف: إعادة توجيه 127.0.0.1 → localhost
// عشان الـ session cookies تشتغل صح (بتتحفظ على localhost مش 127.0.0.1)
// ==========================================
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";

  // لو الطلب جاي من 127.0.0.1 — حوّله لـ localhost بنفس الـ path والـ query
  if (host.startsWith("127.0.0.1")) {
    // استبدال 127.0.0.1 بـ localhost مع الحفاظ على نفس الـ port
    const newHost    = host.replace("127.0.0.1", "localhost");
    const newUrl     = new URL(req.url);
    newUrl.hostname  = "localhost";

    // استخراج الـ port من الـ host لو موجود (مثلاً: 127.0.0.1:3000 → localhost:3000)
    const port = host.split(":")[1];
    if (port) newUrl.port = port;

    // Redirect دائم (308) عشان المتصفح يحفظ التحويل
    return NextResponse.redirect(newUrl.toString(), { status: 308 });
  }

  // أي طلب تاني — اتركه يكمل عادي
  return NextResponse.next();
}

// ==========================================
// config — بيحدد على أنهي routes الـ middleware يشتغل
// بنستثني الملفات الثابتة (_next/static, الصور، إلخ)
// عشان ما نعملش redirect على assets
// ==========================================
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
