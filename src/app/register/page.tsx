"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Waves, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ==========================================
// قواعد التحقق من صحة نموذج التسجيل
// ==========================================
const registerSchema = z
  .object({
    name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    phone: z
      .string()
      .regex(/^01[0-9]{9}$/, "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم"),
    national_id: z
      .string()
      .regex(/^[0-9]{14}$/, "الرقم القومي يجب أن يتكون من 14 رقم")
      .optional()
      .or(z.literal("")),
    email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    // التحقق من تطابق كلمتا السر
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // ==========================================
  // دالة التسجيل - تُرسل البيانات لـ API
  // ==========================================
  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        national_id: data.national_id,
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "حدث خطأ، يرجى المحاولة مجدداً");
      return;
    }

    // التسجيل ناجح → وجّه لصفحة تسجيل الدخول
    router.push("/login?registered=true");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">

      {/* تأثير الخلفية التزيينية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{ background: "var(--cyan)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ background: "var(--gold)", filter: "blur(60px)" }}
        />
      </div>

      <div className="w-full max-w-md relative">

        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "var(--cyan-muted)", border: "1px solid var(--cyan)" }}
          >
            <Waves className="w-8 h-8" style={{ color: "var(--cyan)" }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">إنشاء حساب جديد</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            أكاديمية طنطا للسباحة — ولي الأمر
          </p>
        </div>

        {/* بطاقة التسجيل */}
        <Card style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-white text-center">
              بيانات ولي الأمر
            </h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* الاسم الكامل */}
              <div className="space-y-1.5">
                <Label className="text-white">الاسم الكامل</Label>
                <Input
                  placeholder="محمد أحمد علي"
                  {...register("name")}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                />
                {errors.name && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* رقم الهاتف */}
              <div className="space-y-1.5">
                <Label className="text-white">رقم الهاتف</Label>
                <Input
                  placeholder="01xxxxxxxxx"
                  {...register("phone")}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {errors.phone && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* الرقم القومي (اختياري) */}
              <div className="space-y-1.5">
                <Label className="text-white">
                  الرقم القومي{" "}
                  <span style={{ color: "var(--muted-foreground)" }}>(اختياري)</span>
                </Label>
                <Input
                  placeholder="14 رقم"
                  {...register("national_id")}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {errors.national_id && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {errors.national_id.message}
                  </p>
                )}
              </div>

              {/* البريد الإلكتروني */}
              <div className="space-y-1.5">
                <Label className="text-white">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  {...register("email")}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {errors.email && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* كلمة المرور */}
              <div className="space-y-1.5">
                <Label className="text-white">كلمة المرور</Label>
                <Input
                  type="password"
                  placeholder="8 أحرف على الأقل"
                  {...register("password")}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {errors.password && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* تأكيد كلمة المرور */}
              <div className="space-y-1.5">
                <Label className="text-white">تأكيد كلمة المرور</Label>
                <Input
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  {...register("confirmPassword")}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {errors.confirmPassword && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* رسالة الخطأ العامة */}
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

              {/* زر التسجيل */}
              <Button
                type="submit"
                className="w-full font-semibold h-11"
                disabled={isSubmitting}
                style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>

            </form>

            {/* رابط للعودة لتسجيل الدخول */}
            <div className="mt-5 text-center">
              <a
                href="/login"
                className="inline-flex items-center gap-1 text-sm hover:underline"
                style={{ color: "var(--cyan)" }}
              >
                <ArrowRight className="w-3 h-3" />
                لدي حساب بالفعل
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
