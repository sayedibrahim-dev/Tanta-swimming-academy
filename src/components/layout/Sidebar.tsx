"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LogOut, Menu, X,
  LayoutDashboard, ClipboardList, CreditCard,
  Users, GraduationCap, UsersRound, Settings, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

// ==========================================
// قوائم التنقل حسب دور المستخدم
// ==========================================
const navItemsByRole: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
  admin: [
    { label: "لوحة التحكم",       href: "/admin",           icon: LayoutDashboard },
    { label: "طلبات الالتحاق",    href: "/admin/requests",  icon: ClipboardList   },
    { label: "المدفوعات الشهرية", href: "/admin/payments",  icon: CreditCard      },
    { label: "السباحون",          href: "/admin/swimmers",  icon: Users           },
    { label: "المدربون",          href: "/admin/coaches",   icon: GraduationCap   },
    { label: "المجموعات",         href: "/admin/groups",    icon: UsersRound      },
    { label: "التقارير",          href: "/admin/reports",   icon: FileText        },
  ],
  coach: [
    { label: "لوحة التحكم", href: "/coach",           icon: LayoutDashboard },
    { label: "سباحيّ",      href: "/coach/swimmers",  icon: Users           },
    { label: "الإعدادات",   href: "/coach/settings",  icon: Settings        },
  ],
  parent: [
    { label: "لوحة التحكم", href: "/parent",          icon: LayoutDashboard },
    { label: "أبنائي",      href: "/parent/swimmers", icon: Users           },
    { label: "المدفوعات",   href: "/parent/payments", icon: CreditCard      },
  ],
};

// ترجمة أسماء الأدوار للعربية
const roleLabels: Record<UserRole, string> = {
  admin:  "الإدارة",
  coach:  "مدرب",
  parent: "ولي أمر",
};

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const items = navItemsByRole[userRole] ?? [];

  // حالة فتح/إغلاق الـ drawer على الموبايل
  const [isOpen, setIsOpen] = useState(false);

  // إغلاق الـ drawer عند الضغط على أي رابط
  const handleLinkClick = () => setIsOpen(false);

  return (
    <>
      {/* ==========================================
          زر الهامبرغر — يظهر فقط على الموبايل
          ========================================== */}
      <button
        className="fixed top-3 right-3 z-50 p-2 rounded-xl md:hidden"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
        onClick={() => setIsOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* ==========================================
          خلفية داكنة عند فتح الـ drawer على الموبايل
          النقر عليها يغلق الـ drawer
          ========================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ==========================================
          الـ Sidebar الرئيسي
          - موبايل: drawer بيانزلق من اليمين
          - كمبيوتر: ثابت دائماً على اليمين
          ========================================== */}
      <aside
        className={cn(
          "fixed right-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300",
          // على الموبايل: مخفي لليمين بالكامل — يظهر لما isOpen = true
          isOpen ? "translate-x-0" : "translate-x-full",
          // على الكمبيوتر: ظاهر دائماً بدون translate
          "md:translate-x-0"
        )}
        style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--sidebar-border)" }}
      >
        {/* ==========================================
            رأس الشريط — اللوجو والاسم + زر الإغلاق على الموبايل
            ========================================== */}
        <div className="p-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center justify-between">

            {/* اللوجو والاسم */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--cyan-muted)" }}
              >
                <Image
                  src="/tanat-logo.png"
                  alt="أكاديمية طنطا للسباحة"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">أكاديمية طنطا</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {roleLabels[userRole]}
                </p>
              </div>
            </div>

            {/* زر إغلاق الـ drawer — يظهر فقط على الموبايل */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* ==========================================
            عناصر القائمة
            ========================================== */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "text-white" : "hover:bg-white/5"
                )}
                style={isActive
                  ? { background: "var(--cyan-muted)", color: "var(--cyan)", borderRight: "3px solid var(--cyan)" }
                  : { color: "var(--sidebar-foreground)" }
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ==========================================
            أسفل الشريط — المستخدم وزر الخروج
            ========================================== */}
        <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {roleLabels[userRole]}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:bg-white/5"
            style={{ color: "var(--destructive)" }}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
