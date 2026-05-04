// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من هوية المستخدم
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// ==========================================
// Handler الـ DELETE — حذف مجموعة تدريبية
// المسار: DELETE /api/admin/groups/[id]
//
// ملاحظة: عند الحذف، الـ swimmers.group_id يتحوّل لـ NULL تلقائياً
// بسبب ON DELETE SET NULL في مخطط قاعدة البيانات
// ==========================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params كـ Promise في Next.js 16
) {

  // التحقق من أن المستخدم أدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // استخراج معرف المجموعة من الـ URL — يجب await لأن params هي Promise
  const { id: groupId } = await params;

  // ==========================================
  // التحقق من وجود المجموعة قبل الحذف
  // ==========================================
  const { data: group, error: fetchError } = await supabaseAdmin
    .from("training_groups")
    .select("id")   // نحتاج فقط التحقق من الوجود
    .eq("id", groupId)
    .single();

  // لو المجموعة مش موجودة
  if (fetchError || !group) {
    return NextResponse.json({ error: "المجموعة غير موجودة" }, { status: 404 });
  }

  // ==========================================
  // حذف المجموعة من قاعدة البيانات
  // السباحون المرتبطون بها ستتحوّل group_id عندهم لـ NULL تلقائياً
  // ==========================================
  const { error: deleteError } = await supabaseAdmin
    .from("training_groups")
    .delete()
    .eq("id", groupId);

  // لو فشل الحذف
  if (deleteError) {
    console.error("خطأ في حذف المجموعة:", deleteError);
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }

  // إرجاع استجابة النجاح
  return NextResponse.json({ message: "تم حذف المجموعة بنجاح" });
}
