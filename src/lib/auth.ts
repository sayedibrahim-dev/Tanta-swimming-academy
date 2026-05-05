import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { UserRole } from "./types";

// ==========================================
// getAppSession — يقرأ الـ JWT مباشرة من الـ cookie
// بديل عن getServerSession لأن NextAuth v4 مش بيتوافق صح مع
// Next.js 16 اللي بيعامل cookies() كـ async Promise
// ==========================================
export async function getAppSession() {
  // قراءة الـ cookie store بشكل async كما يتطلب Next.js 16
  const cookieStore = await cookies();

  // اسم الـ cookie في بيئة dev (بدون HTTPS) هو next-auth.session-token
  // في production مع HTTPS يصبح __Secure-next-auth.session-token
  const token =
    cookieStore.get("next-auth.session-token")?.value ??
    cookieStore.get("__Secure-next-auth.session-token")?.value;

  if (!token) return null;

  try {
    // فك تشفير الـ JWT باستخدام نفس الـ secret
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!decoded?.sub) return null;

    // إعادة نفس شكل الـ session اللي كان بيرجعه getServerSession
    return {
      user: {
        id:        decoded.id        as string,
        email:     decoded.email     as string,
        name:      decoded.name      as string,
        role:      decoded.role      as UserRole,
        profileId: decoded.profileId as string,
      },
    };
  } catch {
    return null;
  }
}

// ==========================================
// إعدادات NextAuth الرئيسية
// هذا الكائن يُستخدم في كل مكان يحتاج إعدادات المصادقة
// ==========================================
export const authOptions: NextAuthOptions = {
  // تسجيل الدخول عن طريق الإيميل وكلمة السر فقط (بدون Google أو Facebook)
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },

      // هذه الدالة تُنفَّذ عند كل محاولة تسجيل دخول
      async authorize(credentials) {
        // التحقق من وجود الإيميل وكلمة السر
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // البحث عن المستخدم في قاعدة البيانات بالإيميل
        // maybeSingle بدل single — لأن عدم الوجود طبيعي (بريد خاطئ)
        // single() بيرمي PGRST116 error في الـ logs عند كل محاولة دخول بإيميل غير موجود
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id, email, name, phone, role, password_hash")
          .eq("email", credentials.email)
          .maybeSingle();

        if (!user) {
          // المستخدم غير موجود
          return null;
        }

        // مقارنة كلمة السر المُدخلة مع المخزنة (مشفرة بـ bcrypt)
        const bcrypt = await import("bcryptjs");
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          return null;
        }

        // جلب الـ profileId حسب دور المستخدم
        let profileId = "";

        if (user.role === "coach") {
          // إذا كان مدرباً، نجلب الـ coach_id الخاص به
          const { data: coach } = await supabaseAdmin
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .single();
          profileId = coach?.id ?? "";
        } else if (user.role === "parent") {
          // إذا كان ولي أمر، نجلب الـ parent_id الخاص به
          const { data: parent } = await supabaseAdmin
            .from("parents")
            .select("id")
            .eq("user_id", user.id)
            .single();
          profileId = parent?.id ?? "";
        }

        // إرجاع بيانات المستخدم لتُخزن في الـ Session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          profileId,
        };
      },
    }),
  ],

  // ==========================================
  // صفحات مخصصة بدلاً من صفحات NextAuth الافتراضية
  // ==========================================
  pages: {
    signIn: "/login",  // صفحة تسجيل الدخول المخصصة
  },

  // ==========================================
  // Callbacks - تُنفَّذ في مراحل مختلفة من دورة المصادقة
  // ==========================================
  callbacks: {
    // يُنفَّذ عند إنشاء الـ JWT Token (بعد تسجيل الدخول مباشرة)
    async jwt({ token, user }) {
      if (user) {
        // إضافة البيانات المخصصة للـ Token
        token.id = user.id;
        token.role = (user as any).role;
        token.profileId = (user as any).profileId;
      }
      return token;
    },

    // يُنفَّذ في كل طلب يحتاج بيانات الجلسة
    async session({ session, token }) {
      if (token) {
        // نقل البيانات من الـ Token إلى الـ Session المتاحة في الـ Frontend
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.profileId = token.profileId as string;
      }
      return session;
    },
  },

  // ==========================================
  // استراتيجية الجلسة: JWT (بدون قاعدة بيانات للجلسات)
  // أسرع وأبسط من حفظ الجلسات في DB
  // ==========================================
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 أيام قبل انتهاء الجلسة
  },

  secret: process.env.NEXTAUTH_SECRET,
};
