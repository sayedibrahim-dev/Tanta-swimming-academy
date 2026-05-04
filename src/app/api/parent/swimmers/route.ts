import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const addSwimmerSchema = z.object({
  name: z.string().min(3),
  age: z.number().min(4).max(60),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  receipt_image_url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    // التحقق من أن المستخدم مسجل دخوله وله دور "parent"
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "parent") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addSwimmerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });
    }

    const { name, age, level, receipt_image_url } = parsed.data;
    const parentId = session.user.profileId;

    // ==========================================
    // إنشاء سجل السباح (حالته "pending" تلقائياً)
    // ==========================================
    const { data: swimmer, error: swimmerError } = await supabaseAdmin
      .from("swimmers")
      .insert({
        parent_id: parentId,
        name,
        age,
        level,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id")
      .single();

    if (swimmerError || !swimmer) {
      console.error("خطأ في إنشاء السباح:", swimmerError);
      return NextResponse.json({ error: "حدث خطأ أثناء حفظ البيانات" }, { status: 500 });
    }

    // ==========================================
    // إنشاء طلب الالتحاق مرتبطاً بالسباح
    // ==========================================
    const { error: requestError } = await supabaseAdmin
      .from("enrollment_requests")
      .insert({
        swimmer_id: swimmer.id,
        receipt_image_url,
        status: "pending",
      });

    if (requestError) {
      // إذا فشل الطلب، احذف السباح لتجنب بيانات معلقة
      await supabaseAdmin.from("swimmers").delete().eq("id", swimmer.id);
      return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الطلب" }, { status: 500 });
    }

    return NextResponse.json({ message: "تم إرسال الطلب بنجاح", swimmer_id: swimmer.id }, { status: 201 });
  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
