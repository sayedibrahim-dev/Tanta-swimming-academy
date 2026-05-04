// استيراد النوع NextRequest لاستقبال الطلب الوارد
import { NextRequest, NextResponse } from "next/server";

// استيراد دالة جلب الجلسة للتحقق من أن المستخدم مسجل دخوله
import { getServerSession } from "next-auth";

// استيراد إعدادات المصادقة
import { authOptions } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة (بيتجاوز RLS)
import { supabaseAdmin } from "@/lib/supabase";

// ==========================================
// Handler الـ POST — بيستقبل الصورة ويرفعها لـ Supabase Storage
// المسار: POST /api/upload
// بيستخدم service role key عشان يتجاوز قواعد الأمان (RLS)
// ==========================================
export async function POST(req: NextRequest) {

  // التحقق من أن المستخدم مسجل دخوله (أي دور)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // قراءة الـ FormData من الطلب (الصورة + بيانات الرفع)
  const formData = await req.formData();

  // استخراج الملف من الـ FormData
  const file = formData.get("file") as File | null;

  // استخراج اسم الـ bucket (enrollment-receipts أو payment-receipts)
  const bucket = formData.get("bucket") as string | null;

  // استخراج المجلد الفرعي داخل الـ bucket
  const folder = formData.get("folder") as string | null;

  // التحقق من وجود كل البيانات المطلوبة
  if (!file || !bucket || !folder) {
    return NextResponse.json({ error: "بيانات الرفع ناقصة" }, { status: 400 });
  }

  // التحقق من أن الـ bucket من القائمة المسموح بها فقط (منع الرفع لـ buckets أخرى)
  const ALLOWED_BUCKETS = ["enrollment-receipts", "payment-receipts"];
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "bucket غير مسموح به" }, { status: 400 });
  }

  // التحقق من نوع الملف (صور فقط)
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "يرجى رفع صورة فقط" }, { status: 400 });
  }

  // التحقق من حجم الملف (5MB كحد أقصى)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت" }, { status: 400 });
  }

  // تحويل الملف لـ ArrayBuffer ثم Buffer عشان Supabase يقدر يرفعه
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // توليد اسم فريد للملف: folder/timestamp-filename (لتجنب التكرار)
  const filename = `${folder}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;

  // رفع الصورة لـ Supabase Storage باستخدام service role key (بيتجاوز RLS)
  const { data, error: uploadError } = await supabaseAdmin
    .storage
    .from(bucket)       // الـ bucket المطلوب
    .upload(filename, buffer, {
      contentType: file.type,  // نوع الملف (image/png أو image/jpeg إلخ)
      cacheControl: "3600",    // الصورة تتخزن في الكاش ساعة
      upsert: false,           // منع الكتابة فوق ملف موجود بنفس الاسم
    });

  // لو الرفع فشل — ارجع بخطأ
  if (uploadError) {
    console.error("خطأ في رفع الصورة:", uploadError);
    return NextResponse.json({ error: "فشل رفع الصورة" }, { status: 500 });
  }

  // الحصول على الرابط العام للصورة المرفوعة
  const { data: urlData } = supabaseAdmin
    .storage
    .from(bucket)
    .getPublicUrl(data.path); // data.path هو المسار الكامل للملف في الـ bucket

  // إرجاع الرابط العام للصورة للـ Frontend
  return NextResponse.json({ url: urlData.publicUrl });
}
