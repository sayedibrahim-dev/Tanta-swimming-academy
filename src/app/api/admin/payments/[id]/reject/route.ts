// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد مكتبة Zod للتحقق من صحة البيانات الواردة
import { z } from "zod";

// Schema للتحقق من البيانات الواردة في الـ body
const rejectSchema = z.object({
  swimmer_id: z.string().uuid("معرف السباح غير صحيح"), // محتاجينه للتأكيد فقط
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

  // قراءة البيانات من الـ body والتحقق منها
  const body = await req.json();
  const parsed = rejectSchema.safeParse(body);

  // لو البيانات غير صحيحة — ارجع بخطأ 400
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });
  }

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

  // تحديث الدفعة إلى "مرفوضة"
  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({
      status: "rejected",           // تغيير الحالة لـ "مرفوض"
      reviewed_by: session.user.id, // تسجيل معرف الأدمن المراجع
      reviewed_at: new Date().toISOString(), // تسجيل وقت المراجعة
    })
    .eq("id", paymentId); // تحديث الدفعة المحددة

  // لو فشل التحديث — ارجع بخطأ 500
  if (updateError) {
    console.error("خطأ في رفض الإيصال:", updateError);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإيصال" }, { status: 500 });
  }

  // ملاحظة: payment_status للسباح بيفضل "unpaid"
  // ولي الأمر محتاج يرفع إيصال جديد

  // كل حاجة اتعملت بنجاح
  return NextResponse.json({ message: "تم رفض الإيصال" });
}
