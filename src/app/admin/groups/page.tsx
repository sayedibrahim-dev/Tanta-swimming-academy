export const dynamic = "force-dynamic";
// استيراد دالة جلب الجلسة للتحقق من المستخدم

// استيراد دالة التوجيه
import { redirect } from "next/navigation";

// استيراد إعدادات المصادقة
import { getAppSession } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد المكوّن التفاعلي
import GroupsClient from "./GroupsClient";

// استيراد نوع المدرب المشترك
import type { CoachOption } from "@/lib/types";

// صفحة إدارة المجموعات التدريبية — Server Component
export default async function AdminGroupsPage() {

  // التحقق من أن المستخدم أدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  // تشغيل الاستعلامين معاً في نفس الوقت لتسريع التحميل
  const [{ data: groups }, { data: coaches }] = await Promise.all([

    // جلب المجموعات مع بيانات المدرب وعدد السباحين
    supabaseAdmin
      .from("training_groups")
      .select(`
        id,
        coach_id,
        day_pattern,
        time_slot,
        label,
        created_at,
        coach:coaches(id, name),
        swimmers:swimmers(count)
      `)
      // coach:coaches(id, name)    → اسم المدرب المسؤول عن المجموعة
      // swimmers:swimmers(count)   → عدد السباحين في المجموعة
      .order("coach_id"), // مرتبة حسب المدرب عشان نقدر نجمّعها بعدين

    // جلب المدربين النشطين للـ dropdown في فورم الإضافة
    supabaseAdmin
      .from("coaches")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">إدارة المجموعات التدريبية</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {groups?.length ?? 0} مجموعة مسجلة في النظام
        </p>
      </div>

      {/* المكوّن التفاعلي */}
      <GroupsClient
        initialGroups={(groups ?? []) as unknown as GroupItem[]}
        coaches={coaches ?? []}
      />
    </div>
  );
}

// ==========================================
// تعريف شكل بيانات المجموعة الواحدة
// ==========================================
export interface GroupItem {
  id: string;                                        // معرف المجموعة
  coach_id: string;                                  // معرف المدرب
  day_pattern: "SAT_MON_WED" | "SUN_TUE_THU";       // نمط الأيام
  time_slot: "slot1" | "slot2" | "slot3";            // الفترة الزمنية
  label: string;                                     // الاسم المعروض (مولّد تلقائياً)
  created_at: string;                                // تاريخ الإنشاء
  coach: { id: string; name: string } | null;        // بيانات المدرب
  swimmers: { count: number }[];                     // عدد السباحين
}

// CoachOption معرّفة في @/lib/types
export type { CoachOption };
