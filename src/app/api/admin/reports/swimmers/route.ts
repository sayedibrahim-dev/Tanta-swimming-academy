// استيراد NextResponse لإرجاع ردود HTTP
import { NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من صلاحية الأدمن
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// ==========================================
// GET /api/admin/reports/swimmers
// يجلب بيانات كل السباحين لإنشاء التقرير الشامل
// ==========================================
export async function GET() {

  // التحقق من صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

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

  // جلب عدد المدفوعات المقبولة لكل سباح
  const swimmerIds = swimmers?.map((s) => s.id) ?? [];
  const { data: payments } = swimmerIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("swimmer_id")
        .in("swimmer_id", swimmerIds)
        .eq("status", "approved") // المقبولة فقط
    : { data: [] };

  // حساب عدد الإيصالات المقبولة لكل سباح
  const paymentCounts: Record<string, number> = {};
  for (const p of payments ?? []) {
    paymentCounts[p.swimmer_id] = (paymentCounts[p.swimmer_id] ?? 0) + 1;
  }

  // دمج بيانات المدفوعات مع السباحين
  const result = (swimmers ?? []).map((s: any) => ({
    id:                    s.id,
    name:                  s.name,
    age:                   s.age,
    level:                 s.level,
    status:                s.status,
    created_at:            s.created_at,
    coach_name:            s.coaches?.name   ?? "—",
    coach_phone:           s.coaches?.phone  ?? "—",
    group_label:           s.training_groups?.label       ?? "—",
    group_day_pattern:     s.training_groups?.day_pattern ?? "—",
    parent_name:           s.parents?.name  ?? "—",
    parent_phone:          s.parents?.phone ?? "—",
    approved_payments:     paymentCounts[s.id] ?? 0,
  }));

  return NextResponse.json({ swimmers: result });
}
