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

  // ==========================================
  // تنظيف اسم المجلد لمنع Path Traversal
  // نزيل .. و / والأحرف الخطرة
  // ==========================================
  const sanitizedFolder = folder
    .replace(/\.\./g, "")           // إزالة .. (path traversal)
    .replace(/^\/+|\/+$/g, "")      // إزالة / من البداية والنهاية
    .replace(/[^a-zA-Z0-9\-_]/g, "_"); // فقط أحرف وأرقام وشرطة

  if (!sanitizedFolder) {
    return NextResponse.json({ error: "اسم المجلد غير صحيح" }, { status: 400 });
  }

  // التحقق من حجم الملف (5MB كحد أقصى) — قبل قراءة المحتوى لتوفير الموارد
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت" }, { status: 400 });
  }

  // تحويل الملف لـ ArrayBuffer ثم Buffer عشان Supabase يقدر يرفعه
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ==========================================
  // التحقق من نوع الملف عبر Magic Bytes
  // أكثر أماناً من MIME type (الذي يأتي من المتصفح ويمكن تزويره)
  // ==========================================
  const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  const isPNG  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  const isGIF  = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
              && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (!isJPEG && !isPNG && !isGIF && !isWebP) {
    return NextResponse.json({ error: "يرجى رفع صورة حقيقية (JPG أو PNG أو WebP)" }, { status: 400 });
  }

  // توليد اسم فريد للملف: sanitizedFolder/timestamp-filename (لتجنب التكرار)
  const safeFilename = file.name.replace(/\s/g, "_").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${sanitizedFolder}/${Date.now()}-${safeFilename}`;

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

  // ==========================================
  // توليد Signed URL صالح لمدة سنة (365 يوم)
  // أكثر أماناً من Public URL لأن الـ bucket private
  // ==========================================
  const { data: signedData, error: signedError } = await supabaseAdmin
    .storage
    .from(bucket)
    .createSignedUrl(data.path, 60 * 60 * 24 * 365); // صالح سنة كاملة

  if (signedError || !signedData) {
    console.error("خطأ في توليد رابط الصورة:", signedError);
    return NextResponse.json({ error: "فشل توليد رابط الصورة" }, { status: 500 });
  }

  // إرجاع الـ Signed URL للـ Frontend
  return NextResponse.json({ url: signedData.signedUrl });
}
