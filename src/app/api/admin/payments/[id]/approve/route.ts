// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// ==========================================
// Handler الـ POST — بيستقبل طلب قبول الإيصال
// المسار: POST /api/admin/payments/[id]/approve
//
// ملاحظة: لا نُحدّث swimmers.payment_status لأن حالة الدفع
// تُحسب ديناميكياً من جدول payments لكل شهر (بيتصفّر كل شهر أوتوماتيك)
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

  // التحقق من وجود الدفعة وأنها لا تزال معلقة
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from("payments")                  // من جدول المدفوعات
    .select("id, status")              // بنحتاج الـ id والحالة فقط
    .eq("id", paymentId)               // فلترة على معرف الدفعة
    .single();                         // بنتوقع سجل واحد فقط

  // لو الدفعة مش موجودة — ارجع بخطأ 404
  if (fetchError || !payment) {
    return NextResponse.json({ error: "الإيصال غير موجود" }, { status: 404 });
  }

  // لو الدفعة اتراجعت مسبقاً — ارجع بخطأ 409
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "هذا الإيصال تمت مراجعته مسبقاً" }, { status: 409 });
  }

  const now = new Date().toISOString(); // وقت المراجعة

  // تحديث الدفعة إلى "مقبولة" فقط — كفاية لأن حالة الدفع تُحسب ديناميكياً
  const { error: paymentUpdateError } = await supabaseAdmin
    .from("payments")
    .update({
      status: "approved",           // تغيير الحالة لـ "مقبول"
      reviewed_by: session.user.id, // تسجيل معرف الأدمن المراجع
      reviewed_at: now,             // تسجيل وقت المراجعة
    })
    .eq("id", paymentId); // تحديث الدفعة المحددة

  // لو فشل التحديث — ارجع بخطأ 500
  if (paymentUpdateError) {
    console.error("خطأ في تحديث الإيصال:", paymentUpdateError);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإيصال" }, { status: 500 });
  }

  // كل حاجة اتعملت بنجاح
  return NextResponse.json({ message: "تم قبول الإيصال بنجاح" });
}
