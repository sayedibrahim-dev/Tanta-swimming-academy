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
const rejectSchema = z.object({
  // سبب الرفض — لازم يكون فيه 5 أحرف على الأقل
  notes: z.string().min(5, "يرجى كتابة سبب واضح للرفض"),
});

// ==========================================
// Handler الـ POST — بيستقبل طلب الرفض
// المسار: POST /api/admin/requests/[id]/reject
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

  // استخراج معرف الطلب من الـ URL (مثال: /api/admin/requests/abc-123/reject)
  const { id: requestId } = await params; // await مطلوب لأن params هو Promise

  // قراءة البيانات من الـ body وتحقق منها
  const body = await req.json();
  const parsed = rejectSchema.safeParse(body);

  // لو البيانات غير صحيحة (مثلاً: النص قصير جداً) — ارجع بخطأ 400
  if (!parsed.success) {
    return NextResponse.json({ error: "يرجى كتابة سبب واضح للرفض" }, { status: 400 });
  }

  // استخراج سبب الرفض من البيانات المتحقق منها
  const { notes } = parsed.data;

  // ==========================================
  // التحقق من وجود الطلب وأنه لا يزال معلقاً
  // ==========================================
  const { data: request, error: fetchError } = await supabaseAdmin
    .from("enrollment_requests")    // من جدول طلبات الالتحاق
    .select("id, status")           // بنحتاج الـ id والحالة فقط
    .eq("id", requestId)            // بنفلتر على الـ id الوارد في الـ URL
    .single();                      // بنتوقع سجل واحد فقط

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
  // تحديث طلب الالتحاق إلى "مرفوض" مع حفظ السبب
  // ==========================================
  const { error: updateError } = await supabaseAdmin
    .from("enrollment_requests")
    .update({
      status: "rejected",           // تغيير الحالة لـ "مرفوض"
      notes,                        // حفظ سبب الرفض
      reviewed_by: session.user.id, // تسجيل معرف الأدمن الذي راجع الطلب
      reviewed_at: new Date().toISOString(), // تسجيل وقت المراجعة
    })
    .eq("id", requestId); // تحديث الطلب المحدد بالـ ID

  // لو فشل التحديث — ارجع بخطأ 500
  if (updateError) {
    console.error("خطأ في رفض الطلب:", updateError);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الطلب" },
      { status: 500 }
    );
  }

  // كل حاجة اتعملت بنجاح — ارجع رسالة نجاح
  // ملاحظة: السباح بيفضل بحالة "pending" — يخلي ولي الأمر يرفع إيصال جديد لو عايز
  return NextResponse.json({ message: "تم رفض الطلب" });
}
