// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد Zod للتحقق من صحة البيانات
import { z } from "zod";

// ==========================================
// مخطط التحقق من البيانات الواردة
// ==========================================
const createGroupSchema = z.object({
  coach_id:    z.string().uuid("معرف المدرب غير صحيح"),  // معرف المدرب بصيغة UUID
  day_pattern: z.enum(["SAT_MON_WED", "SUN_TUE_THU"], {  // نمط الأيام — قيمتان فقط
    error: "نمط الأيام غير صحيح",
  }),
  time_slot: z.enum(["slot1", "slot2", "slot3"], {       // الفترة الزمنية — ثلاث قيم فقط
    error: "الفترة الزمنية غير صحيحة",
  }),
  label: z.string().min(3, "اسم المجموعة قصير جداً"),    // الاسم المولّد — 3 أحرف على الأقل
});

// ==========================================
// Handler الـ POST — إنشاء مجموعة تدريبية جديدة
// المسار: POST /api/admin/groups
// ==========================================
export async function POST(req: NextRequest) {

  // التحقق من أن المستخدم أدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // قراءة البيانات من الـ body
  const body = await req.json();

  // التحقق من صحة البيانات باستخدام Zod
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    // إرجاع أول خطأ من Zod (issues[0] لأن Zod v4 يستخدم issues لا errors)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  // استخراج البيانات المُتحقق منها
  const { coach_id, day_pattern, time_slot, label } = parsed.data;

  // ==========================================
  // التحقق من وجود المدرب وأنه نشط
  // ==========================================
  const { data: coach, error: coachError } = await supabaseAdmin
    .from("coaches")
    .select("id, active")   // نحتاج فقط التحقق من الوجود والنشاط
    .eq("id", coach_id)
    .single();

  // لو المدرب مش موجود أو غير نشط
  if (coachError || !coach) {
    return NextResponse.json({ error: "المدرب غير موجود" }, { status: 404 });
  }
  if (!coach.active) {
    return NextResponse.json({ error: "المدرب غير نشط" }, { status: 400 });
  }

  // ==========================================
  // التحقق من عدم وجود مجموعة مكررة
  // نفس المدرب + نفس نمط الأيام + نفس الفترة = تكرار
  // ==========================================
  const { data: existingGroup } = await supabaseAdmin
    .from("training_groups")
    .select("id")
    .eq("coach_id", coach_id)
    .eq("day_pattern", day_pattern)
    .eq("time_slot", time_slot)
    .maybeSingle(); // maybeSingle لأنه ممكن متلاقيش حاجة

  // لو لاقينا مجموعة بنفس المواصفات — ارجع بخطأ
  if (existingGroup) {
    return NextResponse.json(
      { error: "يوجد مجموعة بنفس المدرب والأيام والفترة مسبقاً" },
      { status: 409 }
    );
  }

  // ==========================================
  // إنشاء المجموعة في قاعدة البيانات
  // ==========================================
  const { data: newGroup, error: insertError } = await supabaseAdmin
    .from("training_groups")
    .insert({
      coach_id,    // المدرب المسؤول
      day_pattern, // نمط الأيام
      time_slot,   // الفترة الزمنية
      label,       // الاسم المعروض
    })
    .select("id, coach_id, day_pattern, time_slot, label, created_at") // نرجّع البيانات الكاملة
    .single();

  // لو فشل الإدراج
  if (insertError || !newGroup) {
    console.error("خطأ في إنشاء المجموعة:", insertError);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء المجموعة" }, { status: 500 });
  }

  // إرجاع المجموعة الجديدة للـ Client لإضافتها للقائمة
  return NextResponse.json({ group: newGroup }, { status: 201 });
}
