import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// ==========================================
// DELETE /api/admin/parents/[id]
// حذف ولي أمر وكل بياناته المرتبطة
//
// المنطق:
// 1. التحقق من أن المستخدم أدمن
// 2. جلب الـ user_id المرتبط بولي الأمر
// 3. حذف الـ user (الـ parent بيتحذف CASCADE، والـ swimmers بيتحذفوا CASCADE)
// ==========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // التحقق من أن المستخدم أدمن
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // استخراج معرف ولي الأمر من الـ URL
  const { id: parentId } = await params;

  // جلب الـ user_id المرتبط بولي الأمر
  const { data: parent, error: fetchError } = await supabaseAdmin
    .from("parents")
    .select("id, user_id")
    .eq("id", parentId)
    .single();

  // لو ولي الأمر مش موجود — ارجع بخطأ 404
  if (fetchError || !parent) {
    return NextResponse.json({ error: "ولي الأمر غير موجود" }, { status: 404 });
  }

  // ==========================================
  // حذف الـ user المرتبط بولي الأمر
  //
  // parents.user_id REFERENCES users(id) ON DELETE CASCADE
  // → لما نحذف الـ user، الـ parent بيتحذف تلقائياً
  //
  // swimmers.parent_id REFERENCES parents(id) ON DELETE CASCADE
  // → لما الـ parent يتحذف، سباحيه بيتحذفوا تلقائياً كمان
  // ==========================================
  const { error: deleteError } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", parent.user_id);

  if (deleteError) {
    console.error("خطأ في حذف ولي الأمر:", deleteError);
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }

  return NextResponse.json({ message: "تم حذف ولي الأمر بنجاح" });
}
