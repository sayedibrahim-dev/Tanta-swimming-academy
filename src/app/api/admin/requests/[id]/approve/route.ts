// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة (Admin)
import { supabaseAdmin } from "@/lib/supabase";

// استيراد مكتبة Zod للتحقق من صحة البيانات الواردة
import { z } from "zod";

// ==========================================
// Schema للتحقق من البيانات الواردة في الـ body
// ==========================================
const approveSchema = z.object({
  coach_id: z.string().uuid("معرف المدرب غير صحيح"),   // لازم يكون UUID صحيح
  group_id: z.string().uuid("معرف المجموعة غير صحيح"), // لازم يكون UUID صحيح
});

// ==========================================
// Handler الـ POST — بيستقبل طلب القبول
// المسار: POST /api/admin/requests/[id]/approve
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params هو Promise في Next.js 16
) {

  // التحقق من أن المستخدم مسجل دخوله وله صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 }); // 401 = غير مصرح
  }

  // استخراج معرف الطلب من الـ URL (مثال: /api/admin/requests/abc-123/approve)
  const { id: requestId } = await params; // await مطلوب لأن params هو Promise

  // قراءة البيانات من الـ body وتحقق منها
  const body = await req.json();
  const parsed = approveSchema.safeParse(body);

  // لو البيانات غير صحيحة — ارجع بخطأ 400
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });
  }

  // استخراج الـ coach_id و group_id من البيانات المتحقق منها
  const { coach_id, group_id } = parsed.data;

  // ==========================================
  // التحقق من وجود الطلب وأنه لا يزال معلقاً
  // ==========================================
  const { data: request, error: fetchError } = await supabaseAdmin
    .from("enrollment_requests")              // من جدول طلبات الالتحاق
    .select("id, swimmer_id, status")         // بنحتاج الـ id والسباح والحالة فقط
    .eq("id", requestId)                      // بنفلتر على الـ id الوارد في الـ URL
    .single();                                // بنتوقع سجل واحد فقط

  // لو الطلب مش موجود — ارجع بخطأ 404
  if (fetchError || !request) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  // لو الطلب اتراجع مسبقاً — ارجع بخطأ 409 (تعارض)
  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "هذا الطلب تمت مراجعته مسبقاً" },
      { status: 409 } // 409 = Conflict
    );
  }

  // ==========================================
  // التحقق من أن المجموعة المختارة تتبع المدرب المختار
  // (منع إسناد مجموعة لمدرب لا يملكها)
  // ==========================================
  const { data: group, error: groupError } = await supabaseAdmin
    .from("training_groups")          // من جدول المجموعات
    .select("id, coach_id")           // بنحتاج الـ id والمدرب فقط
    .eq("id", group_id)               // فلترة على معرف المجموعة
    .single();

  // لو المجموعة مش موجودة أو مش تابعة للمدرب — ارجع بخطأ 400
  if (groupError || !group || group.coach_id !== coach_id) {
    return NextResponse.json(
      { error: "المجموعة لا تتبع هذا المدرب" },
      { status: 400 }
    );
  }

  // وقت الآن — هيتخزن كـ reviewed_at في السجلات
  const now = new Date().toISOString();

  // ==========================================
  // تحديث طلب الالتحاق إلى "مقبول"
  // ==========================================
  const { error: reqUpdateError } = await supabaseAdmin
    .from("enrollment_requests")
    .update({
      status: "approved",          // تغيير الحالة لـ "مقبول"
      reviewed_by: session.user.id, // تسجيل معرف الأدمن الذي راجع الطلب
      reviewed_at: now,             // تسجيل وقت المراجعة
    })
    .eq("id", requestId); // تحديث الطلب المحدد بالـ ID

  // لو فشل التحديث — ارجع بخطأ 500
  if (reqUpdateError) {
    console.error("خطأ في تحديث الطلب:", reqUpdateError);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الطلب" },
      { status: 500 }
    );
  }

  // ==========================================
  // تحديث السباح: تفعيله وتعيين مدربه ومجموعته
  // ==========================================
  const { error: swimmerUpdateError } = await supabaseAdmin
    .from("swimmers")
    .update({
      status: "active", // تفعيل السباح (كان pending قبل كده)
      coach_id,         // تعيين المدرب
      group_id,         // تعيين المجموعة
    })
    .eq("id", request.swimmer_id); // تحديث السباح المرتبط بالطلب

  // لو فشل تحديث السباح — نتراجع عن تحديث الطلب ونرجع بخطأ
  if (swimmerUpdateError) {
    console.error("خطأ في تحديث السباح:", swimmerUpdateError);

    // Rollback: إعادة الطلب لحالة pending لأن العملية فشلت
    await supabaseAdmin
      .from("enrollment_requests")
      .update({ status: "pending", reviewed_by: null, reviewed_at: null })
      .eq("id", requestId);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تفعيل السباح" },
      { status: 500 }
    );
  }

  // كل حاجة اتعملت بنجاح — ارجع رسالة نجاح
  return NextResponse.json({ message: "تم قبول الطلب بنجاح" });
}
