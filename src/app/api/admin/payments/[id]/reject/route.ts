// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد Zod للتحقق من البيانات الواردة
import { z } from "zod";

// ==========================================
// Schema التحقق من بيانات الطلب
// ==========================================
const schema = z.object({
  rejection_note: z.string().max(300, "السبب طويل جداً (300 حرف كحد أقصى)").optional(), // سبب الرفض — اختياري
});

// ==========================================
// Handler الـ POST — بيستقبل طلب رفض الإيصال
// المسار: POST /api/admin/payments/[id]/reject
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params هو Promise في Next.js 16
) {

  // التحقق من أن المستخدم مسجل دخوله وله صلاحية الأدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // استخراج معرف الدفعة من الـ URL
  const { id: paymentId } = await params; // await مطلوب لأن params هو Promise

  // قراءة بيانات الطلب والتحقق منها
  const body = await req.json().catch(() => ({})); // لو الـ body فارغ — نعطي object فارغ
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 }
    );
  }

  // استخراج سبب الرفض (اختياري)
  const { rejection_note } = parsed.data;

  // التحقق من وجود الدفعة وأنها لا تزال معلقة
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from("payments")           // من جدول المدفوعات
    .select("id, status")       // بنحتاج الـ id والحالة فقط
    .eq("id", paymentId)        // فلترة على معرف الدفعة
    .single();                  // بنتوقع سجل واحد فقط

  // لو الدفعة مش موجودة — ارجع بخطأ 404
  if (fetchError || !payment) {
    return NextResponse.json({ error: "الإيصال غير موجود" }, { status: 404 });
  }

  // لو الدفعة اتراجعت مسبقاً — ارجع بخطأ 409
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "هذا الإيصال تمت مراجعته مسبقاً" }, { status: 409 });
  }

  // تحديث الدفعة إلى "مرفوضة" مع حفظ سبب الرفض
  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({
      status: "rejected",                    // تغيير الحالة لـ "مرفوض"
      rejection_note: rejection_note ?? null, // سبب الرفض (ممكن يكون null)
      reviewed_by: session.user.id,          // تسجيل معرف الأدمن المراجع
      reviewed_at: new Date().toISOString(), // تسجيل وقت المراجعة
    })
    .eq("id", paymentId); // تحديث الدفعة المحددة

  // لو فشل التحديث — ارجع بخطأ 500
  if (updateError) {
    console.error("خطأ في رفض الإيصال:", updateError);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإيصال" }, { status: 500 });
  }

  // كل حاجة اتعملت بنجاح
  return NextResponse.json({ message: "تم رفض الإيصال" });
}
