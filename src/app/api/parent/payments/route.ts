import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const paymentSchema = z.object({
  swimmer_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
  receipt_image_url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "parent") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });
    }

    const { swimmer_id, month, year, receipt_image_url } = parsed.data;

    // ==========================================
    // التحقق من أن السباح تابع لولي الأمر هذا
    // (منع رفع إيصال لسباح شخص آخر)
    // ==========================================
    const { data: swimmer } = await supabaseAdmin
      .from("swimmers")
      .select("id, status")
      .eq("id", swimmer_id)
      .eq("parent_id", session.user.profileId)
      .single();

    if (!swimmer) {
      return NextResponse.json({ error: "السباح غير موجود" }, { status: 404 });
    }

    if (swimmer.status !== "active") {
      return NextResponse.json({ error: "لا يمكن رفع إيصال لسباح غير نشط" }, { status: 400 });
    }

    // ==========================================
    // التحقق من عدم وجود دفع مقبول لنفس الشهر
    // maybeSingle بدل single — لأن ممكن مفيش دفعة وده طبيعي (أول رفع للشهر)
    // single() بيرمي PGRST116 error في الـ logs لو مفيش rows
    // ==========================================
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("swimmer_id", swimmer_id)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (existingPayment?.status === "approved") {
      return NextResponse.json(
        { error: "تم قبول الدفع لهذا الشهر بالفعل" },
        { status: 409 }
      );
    }

    // إذا كان هناك دفع مرفوض أو قيد الانتظار، نحذفه ونستبدله
    if (existingPayment) {
      await supabaseAdmin.from("payments").delete().eq("id", existingPayment.id);
    }

    // ==========================================
    // إنشاء سجل الدفع الجديد
    // ==========================================
    const { error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        swimmer_id,
        month,
        year,
        receipt_image_url,
        status: "pending",
      });

    if (insertError) {
      console.error("خطأ في إنشاء الدفع:", insertError);
      return NextResponse.json({ error: "حدث خطأ أثناء الحفظ" }, { status: 500 });
    }

    return NextResponse.json({ message: "تم رفع الإيصال بنجاح" }, { status: 201 });
  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
