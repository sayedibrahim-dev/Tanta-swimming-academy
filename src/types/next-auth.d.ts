import { UserRole } from "@/lib/types";
import "next-auth";
import "next-auth/jwt";

// ==========================================
// توسيع أنواع NextAuth لإضافة الحقول المخصصة
// بدون هذا الملف، TypeScript سيشتكي عند الوصول لـ session.user.role
// ==========================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      // دور المستخدم في النظام
      role: UserRole;
      // معرف الملف الشخصي (coach_id أو parent_id)
      profileId: string;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    profileId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    profileId: string;
  }
}
