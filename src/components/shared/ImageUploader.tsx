// تحديد إن المكوّن ده Client Component (بيشتغل في المتصفح)
"use client";

// استيراد useState للتحكم في حالة المكوّن
import { useState, useRef } from "react";

// استيراد الأيقونات المستخدمة
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react";

// ==========================================
// Props المكوّن
// ==========================================
interface ImageUploaderProps {
  bucket: string;              // اسم الـ bucket في Supabase (enrollment-receipts أو payment-receipts)
  folder: string;              // المجلد الفرعي داخل الـ bucket
  onUploadComplete: (url: string) => void; // دالة بتتنادى بعد الرفع وبترجع رابط الصورة
  label?: string;              // نص التسمية فوق منطقة الرفع
}

export default function ImageUploader({
  bucket,
  folder,
  onUploadComplete,
  label = "صورة الإيصال",
}: ImageUploaderProps) {

  // حالة السحب والإفلات (بيتغير لون المنطقة لما نسحب صورة فوقها)
  const [isDragging, setIsDragging] = useState(false);

  // الصورة المعاينة قبل وبعد الرفع (base64 string)
  const [preview, setPreview] = useState<string | null>(null);

  // حالة التحميل أثناء الرفع
  const [uploading, setUploading] = useState(false);

  // حالة النجاح بعد الرفع
  const [uploaded, setUploaded] = useState(false);

  // رسالة الخطأ لو حصل مشكلة
  const [error, setError] = useState<string | null>(null);

  // مرجع لحقل input الملف المخفي (عشان نفتحه لما المستخدم يضغط على المنطقة)
  const inputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // دالة معالجة الملف المختار (من النقر أو السحب)
  // ==========================================
  const handleFile = async (file: File) => {
    setError(null); // مسح أي خطأ سابق

    // التحقق من نوع الملف (صور فقط)
    if (!file.type.startsWith("image/")) {
      setError("يرجى رفع صورة فقط (JPG، PNG، إلخ)");
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }

    // عرض معاينة الصورة قبل الرفع (تحويلها لـ base64)
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true); // تفعيل حالة التحميل

    // ==========================================
    // رفع الصورة عن طريق الـ API Route
    // بدل ما نرفع مباشرة لـ Supabase (كان بيتعرض للـ RLS)
    // الـ API بيستخدم service role key يتجاوز قواعد الأمان
    // ==========================================
    const formData = new FormData();
    formData.append("file", file);       // الملف نفسه
    formData.append("bucket", bucket);   // اسم الـ bucket
    formData.append("folder", folder);   // المجلد الفرعي

    // إرسال الملف للـ API
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData, // FormData بدون Content-Type header (المتصفح بيحدده أوتوماتيك)
    });

    setUploading(false); // إيقاف حالة التحميل

    // لو الرفع فشل — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "فشل رفع الصورة، يرجى المحاولة مجدداً");
      return;
    }

    // استخراج رابط الصورة من الـ response
    const data = await res.json();

    setUploaded(true); // تفعيل حالة النجاح

    // إرسال رابط الصورة للمكوّن الأب
    onUploadComplete(data.url);
  };

  // ==========================================
  // معالجة السحب والإفلات
  // ==========================================
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();         // منع السلوك الافتراضي للمتصفح
    setIsDragging(false);       // إيقاف تأثير السحب
    const file = e.dataTransfer.files[0]; // أخذ أول ملف تم إفلاته
    if (file) handleFile(file);
  };

  // ==========================================
  // إزالة الصورة المختارة وإعادة التعيين
  // ==========================================
  const handleRemove = () => {
    setPreview(null);           // مسح المعاينة
    setUploaded(false);         // إعادة حالة النجاح
    setError(null);             // مسح الأخطاء
    onUploadComplete("");       // إبلاغ المكوّن الأب إن مفيش صورة
    if (inputRef.current) inputRef.current.value = ""; // مسح قيمة الـ input
  };

  return (
    <div className="space-y-2">

      {/* تسمية منطقة الرفع */}
      <label className="block text-sm font-medium text-white">{label}</label>

      {/* ==========================================
          منطقة الرفع — بتتغير حسب الحالة
          ========================================== */}
      {!preview ? (

        // الحالة الأولى: لسه مفيش صورة — منطقة السحب والإفلات
        <div
          onClick={() => inputRef.current?.click()} // فتح مربع اختيار الملف
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}  // تفعيل تأثير السحب
          onDragLeave={() => setIsDragging(false)}  // إيقاف تأثير السحب
          onDrop={handleDrop}                        // معالجة الإفلات
          className="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
          style={{
            borderColor: isDragging ? "var(--cyan)" : "var(--border)",    // حد سيان لما بيسحب
            background: isDragging ? "var(--cyan-muted)" : "var(--secondary)", // خلفية سيان خفيفة لما بيسحب
          }}
        >
          {/* أيقونة الرفع */}
          <Upload
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: isDragging ? "var(--cyan)" : "var(--muted-foreground)" }}
          />

          {/* نص التعليمات */}
          <p className="text-sm font-medium text-white mb-1">
            اسحب الصورة هنا أو اضغط للاختيار
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            JPG، PNG — حتى 5 ميجابايت
          </p>

          {/* حقل input الملف المخفي — بيتفتح لما المستخدم يضغط على المنطقة */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"   // قبول الصور فقط
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file); // معالجة الملف المختار
            }}
          />
        </div>
      ) : (

        // الحالة الثانية: تم اختيار صورة — عرض المعاينة
        <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>

          {/* الصورة المعاينة */}
          <img
            src={preview}
            alt="معاينة الإيصال"
            className="w-full h-48 object-cover"
          />

          {/* طبقة شفافة فوق الصورة بتعرض حالة الرفع */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(0.08 0 0 / 60%)" }}
          >
            {/* حالة التحميل — أيقونة دوارة */}
            {uploading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--cyan)" }} />
                <p className="text-sm text-white">جاري الرفع...</p>
              </div>
            )}

            {/* حالة النجاح — علامة صح */}
            {uploaded && (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.72 0.2 145)" }} />
                <p className="text-sm text-white font-medium">تم الرفع بنجاح</p>
              </div>
            )}
          </div>

          {/* زرار حذف الصورة — بيظهر بس لو مش في حالة تحميل */}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--destructive)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      )}

      {/* رسالة الخطأ — بتظهر بس لو فيه خطأ */}
      {error && (
        <p className="text-xs" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
