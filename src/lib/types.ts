// ==========================================
// أنواع الأدوار في النظام
// ==========================================
export type UserRole = "admin" | "coach" | "parent";

// ==========================================
// أنواع الحالات المختلفة
// ==========================================

// حالة طلب الالتحاق أو الدفع
export type RequestStatus = "pending" | "approved" | "rejected";

// حالة الدفع الشهري للسباح
export type PaymentStatus = "paid" | "unpaid";

// نمط أيام المجموعة التدريبية
export type DayPattern = "SAT_MON_WED" | "SUN_TUE_THU";

// الفترة الزمنية داخل المجموعة (3 فترات لكل نمط)
export type TimeSlot = "slot1" | "slot2" | "slot3";

// ==========================================
// نوع بيانات المستخدم (يمثل جدول users في DB)
// ==========================================
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

// ==========================================
// نوع بيانات المدرب
// ==========================================
export interface Coach {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  active: boolean;
  // علاقة مع جدول users (تُحمّل عند الحاجة)
  user?: User;
}

// ==========================================
// نوع بيانات ولي الأمر
// ==========================================
export interface Parent {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  national_id: string;
  // علاقة مع جدول users
  user?: User;
}

// ==========================================
// نوع بيانات المجموعة التدريبية
// ==========================================
export interface TrainingGroup {
  id: string;
  coach_id: string;
  day_pattern: DayPattern;
  time_slot: TimeSlot;
  // الاسم المعروض مثال: "سبت/اثنين/أربعاء - 8 صباحاً"
  label: string;
  // علاقة مع بيانات المدرب
  coach?: Coach;
}

// ==========================================
// نوع بيانات السباح
// ==========================================
export interface Swimmer {
  id: string;
  parent_id: string;
  name: string;
  age: number;
  // المستوى: مبتدئ، متوسط، متقدم
  level: "beginner" | "intermediate" | "advanced";
  coach_id: string | null;
  group_id: string | null;
  // حالة السباح في النظام
  status: "pending" | "active" | "inactive";
  created_at: string;
  // علاقات مع جداول أخرى (تُحمّل عند الحاجة)
  parent?: Parent;
  coach?: Coach;
  group?: TrainingGroup;
  // حالة الدفع للشهر الحالي (تُحسب من جدول payments)
  current_payment_status?: PaymentStatus;
}

// ==========================================
// نوع بيانات طلب الالتحاق
// ==========================================
export interface EnrollmentRequest {
  id: string;
  swimmer_id: string;
  // رابط صورة الإيصال المرفوعة في Supabase Storage
  receipt_image_url: string;
  status: RequestStatus;
  // ملاحظة الإدارة عند الرفض
  notes: string | null;
  created_at: string;
  // علاقة مع بيانات السباح
  swimmer?: Swimmer;
}

// ==========================================
// نوع بيانات الدفع الشهري
// ==========================================
export interface Payment {
  id: string;
  swimmer_id: string;
  month: number;   // رقم الشهر 1-12
  year: number;    // السنة مثال: 2025
  receipt_image_url: string;
  status: RequestStatus;
  reviewed_by: string | null;  // id المدير الذي راجع الإيصال
  reviewed_at: string | null;
  created_at: string;
  // علاقة مع بيانات السباح
  swimmer?: Swimmer;
}

// ==========================================
// خيارات القوائم المنسدلة — مشتركة بين لوحة الأدمن وصفحة الطلبات
// ==========================================
export interface CoachOption {
  id: string;   // معرف المدرب
  name: string; // اسم المدرب
}

export interface GroupOption {
  id: string;       // معرف المجموعة
  label: string;    // اسم المجموعة المعروض
  coach_id: string; // معرف المدرب المسؤول (للفلترة)
}

// ==========================================
// ترجمة مستويات السباحة إلى العربية — مشتركة في كل الصفحات
// ==========================================
export const levelLabels: Record<string, string> = {
  beginner:     "مبتدئ",
  intermediate: "متوسط",
  advanced:     "متقدم",
};

// ==========================================
// نوع بيانات الجلسة (Session) - ما يُخزن بعد تسجيل الدخول
// ==========================================
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // ID إضافي حسب الدور (coach_id أو parent_id)
  profileId: string;
}
