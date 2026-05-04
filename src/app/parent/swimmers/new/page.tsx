"use client"; // يجب أن يكون أول سطر في الملف — Client Component لا تدعم export const dynamic

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ImageUploader from "@/components/shared/ImageUploader";

// ==========================================
// قواعد التحقق من بيانات السباح
// ==========================================
const swimmerSchema = z.object({
  name: z.string().min(3, "اسم السباح يجب أن يكون 3 أحرف على الأقل"),
  age: z
    .number()
    .min(4, "الحد الأدنى للعمر 4 سنوات")
    .max(60, "الحد الأقصى للعمر 60 سنة"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

type SwimmerFormData = z.infer<typeof swimmerSchema>;

// ==========================================
// تسميات المستويات بالعربية
// ==========================================
const levelOptions = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
];

export default function AddSwimmerPage() {
  const router = useRouter();

  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SwimmerFormData>({
    resolver: zodResolver(swimmerSchema),
  });

  // ==========================================
  // دالة إرسال الطلب
  // ==========================================
  const onSubmit = async (data: SwimmerFormData) => {
    setError(null);

    // التحقق من أن الإيصال تم رفعه
    if (!receiptUrl) {
      setError("يرجى رفع صورة إيصال الدفع أولاً");
      return;
    }

    const response = await fetch("/api/parent/swimmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        age: data.age,
        level: data.level,
        receipt_image_url: receiptUrl,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "حدث خطأ، يرجى المحاولة مجدداً");
      return;
    }

    setSuccess(true);
    // الانتظار ثانيتين ثم التوجيه لقائمة الأبناء
    setTimeout(() => router.push("/parent/swimmers"), 2000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* ==========================================
          رأس الصفحة
          ========================================== */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
          style={{ border: "1px solid var(--border)" }}
        >
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">تسجيل سباح جديد</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            أدخل بيانات ابنك وارفع إيصال الدفع
          </p>
        </div>
      </div>

      {/* ==========================================
          رسالة النجاح
          ========================================== */}
      {success && (
        <div
          className="rounded-xl p-4 mb-6 text-center glow-gold"
          style={{ background: "var(--gold-muted)", border: "1px solid var(--gold)" }}
        >
          <p className="font-semibold" style={{ color: "var(--gold)" }}>
            ✓ تم إرسال الطلب بنجاح!
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--gold)" }}>
            سيتم مراجعة طلبك من قبل الإدارة وإشعارك بالنتيجة
          </p>
        </div>
      )}

      <Card style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: "var(--cyan)" }} />
            <h2 className="text-lg font-semibold text-white">بيانات السباح</h2>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* اسم السباح */}
            <div className="space-y-1.5">
              <Label className="text-white">اسم السباح</Label>
              <Input
                placeholder="الاسم الكامل للسباح"
                {...register("name")}
                className="bg-secondary border-border text-white placeholder:text-muted-foreground"
              />
              {errors.name && (
                <p className="text-xs" style={{ color: "var(--destructive)" }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* السن */}
            <div className="space-y-1.5">
              <Label className="text-white">العمر (بالسنوات)</Label>
              <Input
                type="number"
                placeholder="مثال: 10"
                min={4}
                max={60}
                {...register("age", { valueAsNumber: true })}
                className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                style={{ direction: "ltr", textAlign: "left" }}
              />
              {errors.age && (
                <p className="text-xs" style={{ color: "var(--destructive)" }}>
                  {errors.age.message}
                </p>
              )}
            </div>

            {/* المستوى */}
            <div className="space-y-1.5">
              <Label className="text-white">المستوى</Label>
              <div className="grid grid-cols-3 gap-3">
                {levelOptions.map((option) => (
                  <label
                    key={option.value}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register("level")}
                      className="peer sr-only"
                    />
                    {/* بطاقة المستوى - تتغير مظهرها عند الاختيار */}
                    <div
                      className="rounded-lg p-3 text-center text-sm font-medium border transition-all duration-200
                        peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-white
                        hover:bg-white/5 text-gray-400 border-gray-700"
                    >
                      {option.label}
                    </div>
                  </label>
                ))}
              </div>
              {errors.level && (
                <p className="text-xs" style={{ color: "var(--destructive)" }}>
                  {errors.level.message}
                </p>
              )}
            </div>

            {/* ==========================================
                رفع إيصال الدفع
                ========================================== */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <ImageUploader
                bucket="enrollment-receipts"
                folder="enrollment"
                onUploadComplete={setReceiptUrl}
                label="صورة إيصال دفع الاشتراك (مطلوب)"
              />

              {/* تنبيه مهم لولي الأمر */}
              <div
                className="mt-3 rounded-lg p-3 text-xs"
                style={{ background: "var(--gold-muted)", color: "var(--gold)" }}
              >
                ⚠️ لن يُقبل طلبك إلا بعد رفع صورة واضحة لإيصال الدفع ومراجعتها من قبل الإدارة
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div
                className="rounded-lg p-3 text-sm text-center"
                style={{
                  background: "oklch(0.65 0.22 25 / 15%)",
                  border: "1px solid oklch(0.65 0.22 25 / 30%)",
                  color: "var(--destructive)",
                }}
              >
                {error}
              </div>
            )}

            {/* زر الإرسال */}
            <Button
              type="submit"
              className="w-full font-semibold h-11"
              disabled={isSubmitting || success}
              style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري إرسال الطلب...
                </>
              ) : (
                "إرسال طلب الالتحاق"
              )}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
