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
// GET /api/admin/reports/coaches
// يجلب بيانات كل المدربين وسباحيهم لإنشاء التقرير
// ==========================================
export async function GET() {

  // التحقق من صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // ==========================================
  // حساب الشهر الماضي للعنوان والتصفية
  // ==========================================
  const now           = simulatedNow();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth     = lastMonthDate.getMonth() + 1; // getMonth() يبدأ من 0
  const lastYear      = lastMonthDate.getFullYear();

  // جلب كل المدربين النشطين
  const { data: coaches, error: coachError } = await supabaseAdmin
    .from("coaches")
    .select("id, name, phone")
    .eq("active", true)
    .order("name", { ascending: true }); // ترتيب أبجدي

  if (coachError) {
    console.error("خطأ في جلب المدربين:", coachError);
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }

  // جلب كل السباحين النشطين مع معرف مدربهم ومعلوماتهم
  const { data: swimmers, error: swimmerError } = await supabaseAdmin
    .from("swimmers")
    .select("id, name, age, level, coach_id, training_groups ( label )")
    .eq("status", "active") // النشطين فقط
    .order("name", { ascending: true }); // ترتيب أبجدي

  if (swimmerError) {
    console.error("خطأ في جلب السباحين:", swimmerError);
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }

  // تجميع السباحين تحت كل مدرب
  const result = (coaches ?? []).map((coach: any) => {
    const coachSwimmers = (swimmers ?? [])
      .filter((s: any) => s.coach_id === coach.id)
      .map((s: any) => ({
        id:          s.id,
        name:        s.name,
        age:         s.age,
        level:       s.level,
        group_label: (s.training_groups as any)?.label ?? "—",
      }));

    return {
      id:             coach.id,
      name:           coach.name,
      phone:          coach.phone ?? "—",
      swimmers_count: coachSwimmers.length,
      swimmers:       coachSwimmers,
    };
  });

  // إرجاع البيانات مع معلومات الشهر المرجعي
  return NextResponse.json({ coaches: result, lastMonth, lastYear });
}
