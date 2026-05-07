// استيراد NextResponse لإرجاع ردود HTTP
import { NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من صلاحية الأدمن
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";
import { simulatedNow } from "@/lib/now";

// ==========================================
// GET /api/admin/reports/swimmers
// يجلب بيانات كل السباحين مع حالة دفع الشهر الماضي
// ==========================================
export async function GET() {

  // التحقق من صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // ==========================================
  // حساب الشهر الماضي
  // مثال: لو دلوقتي مايو 2026 → الشهر الماضي = أبريل 2026
  // ==========================================
  const now          = simulatedNow();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth     = lastMonthDate.getMonth() + 1; // getMonth() يبدأ من 0
  const lastYear      = lastMonthDate.getFullYear();

  // جلب كل السباحين مع بيانات المدرب والمجموعة وولي الأمر
  const { data: swimmers, error } = await supabaseAdmin
    .from("swimmers")
    .select(`
      id,
      name,
      age,
      level,
      status,
      created_at,
      coaches ( name, phone ),
      training_groups ( label, day_pattern ),
      parents ( name, phone )
    `)
    .order("name", { ascending: true }); // ترتيب أبجدي

  if (error) {
    console.error("خطأ في جلب بيانات التقرير:", error);
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }

  // ==========================================
  // جلب السباحين الذين دفعوا الشهر الماضي فقط
  // ==========================================
  const swimmerIds = swimmers?.map((s) => s.id) ?? [];
  const { data: lastMonthPayments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", swimmerIds)
        .eq("month",  lastMonth) // الشهر الماضي فقط
        .eq("year",   lastYear)  // سنة الشهر الماضي
        .eq("status", "approved") // المقبولة فقط
    : { data: [] };

  // Set من معرفات السباحين الذين دفعوا الشهر الماضي — للبحث السريع O(1)
  const paidLastMonthIds = new Set(lastMonthPayments?.map((p) => p.swimmer_id) ?? []);

  // ==========================================
  // دمج البيانات
  // ==========================================
  const result = (swimmers ?? []).map((s: any) => ({
    id:                s.id,
    name:              s.name,
    age:               s.age,
    level:             s.level,
    status:            s.status,
    created_at:        s.created_at,
    coach_name:        s.coaches?.name   ?? "—",
    coach_phone:       s.coaches?.phone  ?? "—",
    group_label:       s.training_groups?.label       ?? "—",
    group_day_pattern: s.training_groups?.day_pattern ?? "—",
    parent_name:       s.parents?.name  ?? "—",
    parent_phone:      s.parents?.phone ?? "—",
    paid_last_month:   paidLastMonthIds.has(s.id), // ✓ مدفوع | ✗ غير مدفوع
  }));

  // إرجاع البيانات مع معلومات الشهر المرجعي
  return NextResponse.json({
    swimmers:  result,
    lastMonth, // رقم الشهر الماضي (1-12)
    lastYear,  // سنة الشهر الماضي
  });
}
