export const dynamic = "force-dynamic";
// استيراد دالة جلب الجلسة للتحقق من المدرب المسجل

// استيراد دالة التوجيه لإعادة التوجيه لو مفيش صلاحية
import { redirect } from "next/navigation";

// استيراد إعدادات المصادقة
import { getAppSession } from "@/lib/auth";

// استيراد الـ Supabase بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد المكوّن التفاعلي للعرض والفلترة
import CoachSwimmersClient from "./CoachSwimmersClient";

// صفحة سباحي المدرب — Server Component (تشتغل على السيرفر)
export default async function CoachSwimmersPage() {

  // التحقق من أن المستخدم مسجل دخوله وله صلاحية المدرب
  const session = await getAppSession();
  if (!session || session.user.role !== "coach") redirect("/login");

  // profileId هو معرف المدرب في جدول coaches (مش users)
  const coachId = session.user.profileId;

  // الشهر والسنة الحاليان لحساب حالة الدفع ديناميكياً
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  // جلب السباحين النشطين التابعين لهذا المدرب فقط مع بيانات ولي الأمر والمجموعة
  const { data: swimmers } = await supabaseAdmin
    .from("swimmers")                       // من جدول السباحين
    .select(`
      id,
      name,
      age,
      level,
      parent:parents(name, phone),
      group:training_groups(id, label)
    `)
    // parent:parents(name, phone)          → اسم ورقم ولي الأمر
    // group:training_groups(id, label)     → اسم المجموعة التدريبية
    .eq("coach_id", coachId)               // بس السباحون التابعون لهذا المدرب
    .eq("status", "active")                // بس السباحون النشطون (مش pending أو inactive)
    .order("name");                        // مرتبين أبجدياً بالاسم

  // جلب الدفعات المقبولة لهذا الشهر لسباحي المدرب
  const swimmerIds = swimmers?.map((s) => s.id) ?? [];
  const { data: approvedPayments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", swimmerIds)
        .eq("month", currentMonth)
        .eq("year",  currentYear)
        .eq("status", "approved")
    : { data: [] };

  // Set من معرفات المدفوعين هذا الشهر
  const paidThisMonthIds = new Set(approvedPayments?.map((p) => p.swimmer_id) ?? []);

  // دمج حالة الدفع الديناميكية مع كل سباح
  const swimmersWithPayment = (swimmers ?? []).map((s) => ({
    ...s,
    payment_status: paidThisMonthIds.has(s.id) ? "paid" : "unpaid",
  }));

  return (
    // حاوية الصفحة بمسافة داخلية
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">سباحيّ</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {/* عدد السباحين النشطين المعيّنين لك */}
          {swimmersWithPayment.length} سباح نشط في مجموعاتك
        </p>
      </div>

      {/* المكوّن التفاعلي — يستقبل قائمة السباحين مع حالة الدفع الديناميكية */}
      <CoachSwimmersClient
        swimmers={swimmersWithPayment as unknown as CoachSwimmerItem[]}
      />
    </div>
  );
}

// ==========================================
// تعريف شكل بيانات السباح الواحد
// ==========================================
export interface CoachSwimmerItem {
  id: string;                                               // معرف السباح
  name: string;                                            // اسم السباح
  age: number;                                             // عمر السباح
  level: "beginner" | "intermediate" | "advanced";        // مستوى السباح
  payment_status: "paid" | "unpaid";                      // حالة الدفع للشهر الحالي
  parent: { name: string; phone: string } | null;         // بيانات ولي الأمر
  group: { id: string; label: string } | null;            // بيانات المجموعة
}
