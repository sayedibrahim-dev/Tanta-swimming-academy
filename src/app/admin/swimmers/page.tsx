export const dynamic = "force-dynamic";
// استيراد دالة جلب الجلسة للتحقق من صلاحية الأدمن

// استيراد دالة التوجيه
import { redirect } from "next/navigation";

// استيراد إعدادات المصادقة
import { getAppSession } from "@/lib/auth";

// استيراد الـ Supabase بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد المكوّن التفاعلي
import SwimmersClient from "./SwimmersClient";

// استيراد الأنواع المشتركة من lib
import type { CoachOption, GroupOption } from "@/lib/types";

// صفحة إدارة السباحين — Server Component (تشتغل على السيرفر)
export default async function AdminSwimmersPage() {

  // التحقق من أن المستخدم مسجل دخوله وله صلاحية الأدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  // الشهر والسنة الحاليان لحساب حالة الدفع ديناميكياً
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  // جلب جميع السباحين النشطين مع بياناتهم الكاملة
  const { data: swimmers } = await supabaseAdmin
    .from("swimmers")             // من جدول السباحين
    .select(`
      id,
      name,
      age,
      level,
      coach_id,
      group_id,
      parent:parents(id, name, phone),
      coach:coaches(id, name),
      group:training_groups(id, label, coach_id)
    `)
    // parent:parents(...)              → بيانات ولي الأمر
    // coach:coaches(...)               → بيانات المدرب
    // group:training_groups(...)       → بيانات المجموعة التدريبية
    .eq("status", "active")           // بس السباحون النشطون
    .order("name");                   // مرتبين أبجدياً

  // جلب الدفعات المقبولة لهذا الشهر (لحساب حالة الدفع ديناميكياً)
  const swimmerIds = swimmers?.map((s) => s.id) ?? [];
  const { data: approvedPayments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", swimmerIds)
        .eq("month", currentMonth)
        .eq("year",  currentYear)
        .eq("status", "approved")         // المقبولة فقط
    : { data: [] };

  // Set من معرفات السباحين المدفوعين هذا الشهر
  const paidThisMonthIds = new Set(approvedPayments?.map((p) => p.swimmer_id) ?? []);

  // دمج حالة الدفع الديناميكية مع بيانات كل سباح
  const swimmersWithPayment = (swimmers ?? []).map((s) => ({
    ...s,
    payment_status: paidThisMonthIds.has(s.id) ? "paid" : "unpaid", // ديناميكي من payments table
  }));

  // جلب المدربين النشطين لقائمة إعادة التعيين
  const { data: coaches } = await supabaseAdmin
    .from("coaches")
    .select("id, name")   // نحتاج فقط المعرف والاسم
    .eq("active", true)   // بس المدربون النشطون
    .order("name");       // مرتبين أبجدياً

  // جلب المجموعات التدريبية لقائمة إعادة التعيين
  const { data: groups } = await supabaseAdmin
    .from("training_groups")
    .select("id, label, coach_id") // نحتاج المعرف والاسم ومعرف المدرب للفلترة
    .order("label");               // مرتبين أبجدياً

  return (
    // حاوية الصفحة بمسافة داخلية
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">إدارة السباحين</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {/* عرض عدد السباحين النشطين */}
          {swimmersWithPayment.length} سباح نشط في النظام
        </p>
      </div>

      {/* المكوّن التفاعلي — يستقبل قوائم البيانات */}
      <SwimmersClient
        initialSwimmers={swimmersWithPayment as unknown as SwimmerItem[]}
        coaches={(coaches ?? []) as CoachOption[]}
        groups={(groups ?? []) as GroupOption[]}
      />
    </div>
  );
}

// ==========================================
// تعريف شكل بيانات السباح الواحد
// ==========================================
export interface SwimmerItem {
  id: string;                                               // معرف السباح
  name: string;                                            // اسم السباح
  age: number;                                             // عمر السباح
  level: "beginner" | "intermediate" | "advanced";        // مستوى السباح
  payment_status: "paid" | "unpaid";                      // حالة الدفع الشهري
  coach_id: string | null;                                 // معرف المدرب (ممكن null)
  group_id: string | null;                                 // معرف المجموعة (ممكن null)
  parent: { id: string; name: string; phone: string } | null;   // بيانات ولي الأمر
  coach:  { id: string; name: string } | null;                  // بيانات المدرب
  group:  { id: string; label: string; coach_id: string } | null; // بيانات المجموعة
}

// CoachOption و GroupOption معرّفتان في @/lib/types
export type { CoachOption, GroupOption };
