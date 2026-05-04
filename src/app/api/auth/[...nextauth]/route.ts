import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// API Route لنظام المصادقة
// يستقبل كل طلبات: /api/auth/signin, /api/auth/signout, /api/auth/session
// NextAuth يتولى معالجة كل هذه الطلبات تلقائياً
// ==========================================
const handler = NextAuth(authOptions);

// تصدير نفس الـ handler لطلبات GET و POST
export { handler as GET, handler as POST };
