// تحديد إن المكوّن ده Client Component (بيشتغل في المتصفح)
"use client";

// استيراد useState لإدارة حالة المكوّن
import { useState } from "react";

// استيراد الأيقونات المستخدمة في الصفحة
import {
  UserPlus,      // أيقونة إضافة مدرب جديد
  Trash2,        // أيقونة حذف المدرب
  Pencil,        // أيقونة تعديل بيانات المدرب
  GraduationCap, // أيقونة المدرب (الحالة الفارغة)
  X,             // أيقونة إغلاق الـ modal
  Loader2,       // أيقونة التحميل الدوارة
  Mail,          // أيقونة الإيميل
  Phone,         // أيقونة التليفون
  Users,         // أيقونة عدد السباحين
  Copy,          // أيقونة نسخ الباسورد
  CheckCircle2,  // أيقونة النجاح
  Eye,           // أيقونة إظهار الباسورد
  EyeOff,        // أيقونة إخفاء الباسورد
} from "lucide-react";

// استيراد مكوّن الزرار والـ Input والـ Label من shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// استيراد نوع بيانات المدرب من صفحة السيرفر
import type { CoachItem } from "./page";

// ==========================================
// Props المكوّن الرئيسي
// ==========================================
interface CoachesClientProps {
  initialCoaches: CoachItem[]; // قائمة المدربين من السيرفر
}

// ==========================================
// شكل بيانات فورم إضافة مدرب جديد
// بدون password — النظام بيولّده تلقائياً
// ==========================================
interface NewCoachForm {
  name: string;  // الاسم
  phone: string; // رقم التليفون
  email: string; // الإيميل المؤقت (المدرب يقدر يغيّره بعدين)
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function CoachesClient({ initialCoaches }: CoachesClientProps) {

  // قائمة المدربين — بتتحدث لما نضيف أو نحذف مدرب
  const [coaches, setCoaches] = useState(initialCoaches);

  // حالة modal إضافة مدرب — true = مفتوح
  const [addModal, setAddModal] = useState(false);

  // بيانات الفورم لإضافة مدرب جديد
  const [form, setForm] = useState<NewCoachForm>({
    name: "",
    phone: "",
    email: "",
  });

  // modal النجاح — بيعرض الباسورد المؤقت بعد الإضافة
  const [successModal, setSuccessModal] = useState<{
    coachName: string; // اسم المدرب للعرض
    email: string;     // الإيميل المستخدم
    tempPassword: string; // الباسورد المؤقت المولّد
  } | null>(null);

  // حالة إظهار/إخفاء الباسورد في modal النجاح
  const [showPassword, setShowPassword] = useState(false);

  // حالة نسخ الباسورد — true لمدة ثانيتين بعد النسخ
  const [copied, setCopied] = useState(false);

  // حالة modal تأكيد الحذف — null = مغلق، object = مفتوح مع بيانات المدرب
  const [deleteModal, setDeleteModal] = useState<{
    coachId: string;  // معرف المدرب في جدول coaches
    userId: string;   // معرف المدرب في جدول users
    name: string;     // اسم المدرب للعرض في الـ modal
    swimmerCount: number; // عدد سباحيه (للتحذير)
  } | null>(null);

  // حالة modal تعديل المدرب — null = مغلق، object = مفتوح مع بيانات المدرب الحالية
  const [editModal, setEditModal] = useState<{
    coachId: string; // معرف المدرب للتحديث
    name: string;    // الاسم الحالي
    phone: string;   // التليفون الحالي
    email: string;   // الإيميل الحالي
  } | null>(null);

  // رسالة الخطأ في modal التعديل
  const [editError, setEditError] = useState<string | null>(null);

  // حالة التحميل أثناء إرسال الفورم أو الحذف
  const [submitting, setSubmitting] = useState(false);

  // رسالة الخطأ لو حصل مشكلة
  const [formError, setFormError] = useState<string | null>(null);

  // ==========================================
  // دالة تحديث حقول الفورم
  // ==========================================
  const updateForm = (field: keyof NewCoachForm, value: string) => {
    // تحديث الحقل المحدد بدون تغيير باقي الحقول
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ==========================================
  // دالة نسخ الباسورد للـ clipboard
  // ==========================================
  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password); // نسخ للـ clipboard
    setCopied(true); // تفعيل حالة "تم النسخ"
    setTimeout(() => setCopied(false), 2000); // إعادة الحالة بعد ثانيتين
  };

  // ==========================================
  // دالة فتح modal الإضافة وإعادة تعيين الفورم
  // ==========================================
  const openAddModal = () => {
    setForm({ name: "", phone: "", email: "" }); // مسح الفورم
    setFormError(null); // مسح الأخطاء السابقة
    setAddModal(true);  // فتح الـ modal
  };

  // ==========================================
  // دالة إرسال فورم إضافة مدرب جديد
  // ==========================================
  const handleAdd = async () => {

    // التحقق من ملء كل الحقول المطلوبة
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setFormError("يرجى ملء جميع الحقول");
      return;
    }

    setSubmitting(true);  // تفعيل حالة التحميل
    setFormError(null);   // مسح الأخطاء السابقة

    // إرسال البيانات للـ API — بدون password لأن النظام بيولّده
    const res = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      }),
    });

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ من الـ API — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    // استخراج بيانات المدرب الجديد + الباسورد المؤقت من الـ response
    const data = await res.json();

    // إضافة المدرب الجديد للقائمة بدون reload (Optimistic Update)
    setCoaches((prev) => [
      ...prev,
      {
        id: data.coach.id,
        name: data.coach.name,
        phone: data.coach.phone,
        active: true,
        user_id: data.coach.user_id,
        user: { email: form.email.trim() },
        swimmers: [{ count: 0 }], // مدرب جديد — مفيش سباحين بعد
      },
    ]);

    setAddModal(false); // إغلاق فورم الإضافة

    // فتح modal النجاح لعرض الباسورد المؤقت للأدمن
    setShowPassword(false); // إخفاء الباسورد افتراضياً
    setSuccessModal({
      coachName: form.name.trim(),
      email: form.email.trim(),
      tempPassword: data.tempPassword, // الباسورد المؤقت من الـ API
    });
  };

  // ==========================================
  // دالة فتح modal تأكيد الحذف
  // ==========================================
  const openDeleteModal = (coach: CoachItem) => {
    setFormError(null); // مسح الأخطاء السابقة
    setDeleteModal({
      coachId: coach.id,
      userId: coach.user_id,
      name: coach.name,
      swimmerCount: coach.swimmers[0]?.count ?? 0, // عدد سباحيه
    });
  };

  // ==========================================
  // دالة تأكيد حذف المدرب
  // ==========================================
  const handleDelete = async () => {
    if (!deleteModal) return; // لو الـ modal مش مفتوح — اخرج

    setSubmitting(true);  // تفعيل حالة التحميل
    setFormError(null);   // مسح الأخطاء

    // إرسال طلب الحذف للـ API
    const res = await fetch(`/api/admin/coaches/${deleteModal.coachId}`, {
      method: "DELETE",
    });

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "حدث خطأ أثناء الحذف");
      return;
    }

    // إزالة المدرب من القائمة بدون reload
    setCoaches((prev) => prev.filter((c) => c.id !== deleteModal.coachId));
    setDeleteModal(null); // إغلاق الـ modal
  };

  // ==========================================
  // دالة فتح modal التعديل وتعبئة بيانات المدرب الحالية
  // ==========================================
  const openEditModal = (coach: CoachItem) => {
    setEditError(null); // مسح أي خطأ سابق
    setEditModal({
      coachId: coach.id,
      name:    coach.name,                 // الاسم الحالي
      phone:   coach.phone ?? "",           // التليفون الحالي (أو فارغ)
      email:   coach.user?.email ?? "",     // الإيميل الحالي (أو فارغ)
    });
  };

  // ==========================================
  // دالة إرسال تعديل بيانات المدرب للـ API
  // ==========================================
  const handleEdit = async () => {
    if (!editModal) return; // لو الـ modal مش مفتوح — اخرج

    // التحقق من ملء الحقول الأساسية
    if (!editModal.name.trim() || !editModal.phone.trim() || !editModal.email.trim()) {
      setEditError("يرجى ملء جميع الحقول");
      return;
    }

    setSubmitting(true); // تفعيل حالة التحميل
    setEditError(null);  // مسح الخطأ

    // إرسال بيانات التعديل للـ API
    const res = await fetch(`/api/admin/coaches/${editModal.coachId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:  editModal.name.trim(),  // الاسم المعدّل
        phone: editModal.phone.trim(), // التليفون المعدّل
        email: editModal.email.trim(), // الإيميل المعدّل
      }),
    });

    setSubmitting(false); // إيقاف حالة التحميل

    // لو فيه خطأ — عرض رسالة الخطأ
    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error ?? "حدث خطأ أثناء التحديث");
      return;
    }

    // تحديث بيانات المدرب في القائمة المحلية بدون reload
    setCoaches((prev) =>
      prev.map((c) =>
        c.id === editModal.coachId
          ? {
              ...c,
              name:  editModal.name.trim(),                      // الاسم الجديد
              phone: editModal.phone.trim(),                     // التليفون الجديد
              user:  { ...c.user, email: editModal.email.trim() }, // الإيميل الجديد
            }
          : c
      )
    );

    setEditModal(null); // إغلاق الـ modal بعد النجاح
  };

  return (
    <>
      {/* ==========================================
          رأس القسم — زرار إضافة مدرب
          ========================================== */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={openAddModal}
          className="flex items-center gap-2 font-semibold h-10 px-5"
          style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
        >
          <UserPlus className="w-4 h-4" />
          إضافة مدرب جديد
        </Button>
      </div>

      {/* ==========================================
          الحالة الفارغة — مفيش مدربين
          ========================================== */}
      {coaches.length === 0 ? (
        <div
          className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* أيقونة كبيرة */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--cyan-muted)" }}
          >
            <GraduationCap className="w-8 h-8" style={{ color: "var(--cyan)" }} />
          </div>

          {/* نص الحالة الفارغة */}
          <div>
            <p className="text-lg font-semibold text-white">لا يوجد مدربون بعد</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              اضغط "إضافة مدرب جديد" لإضافة أول مدرب
            </p>
          </div>
        </div>
      ) : (

        // ==========================================
        // شبكة بطاقات المدربين
        // ==========================================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => {

            // عدد السباحين المرتبطين بهذا المدرب
            const swimmerCount = coach.swimmers[0]?.count ?? 0;

            return (
              // بطاقة المدرب الواحد
              <div
                key={coach.id}
                className="rounded-2xl p-5 border flex flex-col gap-4"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                {/* رأس البطاقة — الأيقونة والاسم وزرار الحذف */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">

                    {/* أيقونة المدرب */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--cyan-muted)" }}
                    >
                      <GraduationCap className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                    </div>

                    {/* اسم المدرب */}
                    <div>
                      <p className="font-semibold text-white">{coach.name}</p>

                      {/* بادج "نشط" */}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.65 0.18 145 / 15%)",
                          color: "oklch(0.72 0.2 145)",
                        }}
                      >
                        نشط
                      </span>
                    </div>
                  </div>

                  {/* أزرار التعديل والحذف */}
                  <div className="flex items-center gap-1">

                    {/* زرار التعديل */}
                    <button
                      onClick={() => openEditModal(coach)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0"
                      title="تعديل بيانات المدرب"
                    >
                      <Pencil className="w-4 h-4" style={{ color: "var(--cyan)" }} />
                    </button>

                    {/* زرار الحذف */}
                    <button
                      onClick={() => openDeleteModal(coach)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0"
                      title="حذف المدرب"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "var(--destructive)" }} />
                    </button>
                  </div>
                </div>

                {/* تفاصيل المدرب */}
                <div className="space-y-2">

                  {/* الإيميل */}
                  {coach.user?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      <span style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                        {coach.user.email}
                      </span>
                    </div>
                  )}

                  {/* رقم التليفون */}
                  {coach.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      <span className="font-mono" style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                        {coach.phone}
                      </span>
                    </div>
                  )}

                  {/* عدد السباحين */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {swimmerCount} سباح
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
          Modal إضافة مدرب جديد
          ========================================== */}
      {addModal && (
        // خلفية داكنة شبه شفافة خلف الـ modal
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => {
            // النقر خارج الـ modal بيقفله
            if (e.target === e.currentTarget) setAddModal(false);
          }}
        >
          {/* بطاقة الـ modal */}
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                <h2 className="text-lg font-semibold text-white">إضافة مدرب جديد</h2>
              </div>

              {/* زرار إغلاق الـ modal */}
              <button
                onClick={() => setAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* حقول الفورم */}
            <div className="space-y-4">

              {/* حقل الاسم */}
              <div className="space-y-1.5">
                <Label className="text-white">الاسم الكامل</Label>
                <Input
                  placeholder="مثال: أحمد محمد"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)} // تحديث حقل الاسم
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                />
              </div>

              {/* حقل التليفون */}
              <div className="space-y-1.5">
                <Label className="text-white">رقم التليفون</Label>
                <Input
                  placeholder="مثال: 01012345678"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)} // تحديث حقل التليفون
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>

              {/* حقل الإيميل */}
              <div className="space-y-1.5">
                <Label className="text-white">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="مثال: coach@tanta.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)} // تحديث حقل الإيميل
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>

              {/* تنبيه — الباسورد هيتولّد تلقائياً */}
              <div
                className="text-xs rounded-lg p-3"
                style={{
                  background: "var(--cyan-muted)",
                  color: "var(--cyan)",
                  border: "1px solid oklch(0.72 0.18 195 / 30%)",
                }}
              >
                سيتم توليد كلمة سر مؤقتة تلقائياً وعرضها لك بعد الإضافة — ابعتها للمدرب
              </div>

              {/* رسالة الخطأ — بتظهر بس لو فيه خطأ */}
              {formError && (
                <p
                  className="text-sm rounded-lg p-3"
                  style={{
                    background: "oklch(0.65 0.22 25 / 15%)",
                    color: "oklch(0.65 0.22 25)",
                    border: "1px solid oklch(0.65 0.22 25 / 30%)",
                  }}
                >
                  {formError}
                </p>
              )}

              {/* أزرار الإضافة والإلغاء */}
              <div className="flex gap-3 pt-2">

                {/* زرار إضافة المدرب */}
                <Button
                  onClick={handleAdd}
                  disabled={submitting} // معطّل أثناء الإرسال
                  className="flex-1 font-semibold h-10"
                  style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" /> // أيقونة تحميل أثناء الإرسال
                  ) : (
                    "إضافة المدرب"
                  )}
                </Button>

                {/* زرار الإلغاء */}
                <Button
                  onClick={() => setAddModal(false)}
                  disabled={submitting}
                  variant="ghost"
                  className="flex-1 h-10"
                  style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Modal النجاح — عرض الباسورد المؤقت مرة واحدة
          ========================================== */}
      {successModal && (
        // خلفية داكنة — مش قابلة للإغلاق بالنقر خارجها عشان الأدمن ياخد الباسورد الأول
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.65 0.18 145 / 15%)" }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: "oklch(0.72 0.2 145)" }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">تم إضافة المدرب بنجاح</h2>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {successModal.coachName}
                </p>
              </div>
            </div>

            {/* تعليمات للأدمن */}
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              احفظ بيانات الدخول دي وابعتها للمدرب — الباسورد
              <span className="text-white font-semibold"> مش هيتعرض تاني </span>
              بعد ما تقفل النافذة دي
            </p>

            {/* بيانات الدخول */}
            <div
              className="rounded-xl p-4 space-y-3 mb-5"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
            >
              {/* الإيميل */}
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  البريد الإلكتروني
                </p>
                <p className="text-sm font-mono text-white" style={{ direction: "ltr" }}>
                  {successModal.email}
                </p>
              </div>

              {/* الباسورد المؤقت */}
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  كلمة السر المؤقتة
                </p>
                <div className="flex items-center gap-2">

                  {/* الباسورد — مخفي أو ظاهر حسب الحالة */}
                  <p
                    className="flex-1 text-sm font-mono"
                    style={{ color: "var(--cyan)", direction: "ltr" }}
                  >
                    {showPassword
                      ? successModal.tempPassword       // عرض الباسورد كنص عادي
                      : "•".repeat(successModal.tempPassword.length) // إخفاء بنقاط
                    }
                  </p>

                  {/* زرار إظهار/إخفاء الباسورد */}
                  <button
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                      : <Eye className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                    }
                  </button>

                  {/* زرار نسخ الباسورد */}
                  <button
                    onClick={() => copyPassword(successModal.tempPassword)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                    title="نسخ كلمة السر"
                  >
                    {copied
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.72 0.2 145)" }} /> // علامة صح بعد النسخ
                      : <Copy className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />       // أيقونة النسخ
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* زرار إغلاق الـ modal */}
            <Button
              onClick={() => setSuccessModal(null)}
              className="w-full font-semibold h-10"
              style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
            >
              حفظت البيانات، إغلاق
            </Button>
          </div>
        </div>
      )}

      {/* ==========================================
          Modal تعديل بيانات المدرب
          ========================================== */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                <h2 className="text-lg font-semibold text-white">تعديل بيانات المدرب</h2>
              </div>
              {/* زرار إغلاق الـ modal */}
              <button
                onClick={() => setEditModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* حقول الفورم */}
            <div className="space-y-4">

              {/* حقل الاسم */}
              <div className="space-y-1.5">
                <Label className="text-white">الاسم الكامل</Label>
                <Input
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="مثال: أحمد محمد"
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                />
              </div>

              {/* حقل التليفون */}
              <div className="space-y-1.5">
                <Label className="text-white">رقم التليفون</Label>
                <Input
                  value={editModal.phone}
                  onChange={(e) => setEditModal((prev) => prev ? { ...prev, phone: e.target.value } : prev)}
                  placeholder="مثال: 01012345678"
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>

              {/* حقل الإيميل */}
              <div className="space-y-1.5">
                <Label className="text-white">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={editModal.email}
                  onChange={(e) => setEditModal((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                  placeholder="مثال: coach@tanta.com"
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>

              {/* رسالة الخطأ */}
              {editError && (
                <p
                  className="text-sm rounded-lg p-3"
                  style={{
                    background: "oklch(0.65 0.22 25 / 15%)",
                    color: "oklch(0.65 0.22 25)",
                    border: "1px solid oklch(0.65 0.22 25 / 30%)",
                  }}
                >
                  {editError}
                </p>
              )}

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleEdit}
                  disabled={submitting}
                  className="flex-1 font-semibold h-10"
                  style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
                >
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : "حفظ التعديلات"
                  }
                </Button>
                <Button
                  onClick={() => setEditModal(null)}
                  disabled={submitting}
                  variant="ghost"
                  className="flex-1 h-10"
                  style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Modal تأكيد الحذف
          ========================================== */}
      {deleteModal && (
        // خلفية داكنة شبه شفافة
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteModal(null);
          }}
        >
          {/* بطاقة الـ modal */}
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" style={{ color: "var(--destructive)" }} />
                <h2 className="text-lg font-semibold text-white">حذف المدرب</h2>
              </div>

              {/* زرار إغلاق */}
              <button
                onClick={() => setDeleteModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* نص التحذير */}
            <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
              هل تريد حذف المدرب <span className="text-white font-semibold">"{deleteModal.name}"</span>؟
            </p>

            {/* تحذير إضافي لو فيه سباحين مرتبطين بالمدرب */}
            {deleteModal.swimmerCount > 0 && (
              <div
                className="rounded-lg p-3 mb-4 text-sm"
                style={{
                  background: "var(--gold-muted)",
                  color: "var(--gold)",
                  border: "1px solid oklch(0.78 0.16 75 / 30%)",
                }}
              >
                ⚠️ هذا المدرب لديه {deleteModal.swimmerCount} سباح — سيتم إلغاء ارتباطهم بعد الحذف
                وستحتاج لإعادة تعيينهم لمدرب آخر
              </div>
            )}

            {/* رسالة الخطأ */}
            {formError && (
              <p
                className="text-sm rounded-lg p-3 mb-4"
                style={{
                  background: "oklch(0.65 0.22 25 / 15%)",
                  color: "oklch(0.65 0.22 25)",
                  border: "1px solid oklch(0.65 0.22 25 / 30%)",
                }}
              >
                {formError}
              </p>
            )}

            {/* أزرار التأكيد والإلغاء */}
            <div className="flex gap-3">

              {/* زرار تأكيد الحذف */}
              <Button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 font-semibold h-10"
                style={{ background: "var(--destructive)", color: "white" }}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "تأكيد الحذف"
                )}
              </Button>

              {/* زرار الإلغاء */}
              <Button
                onClick={() => setDeleteModal(null)}
                disabled={submitting}
                variant="ghost"
                className="flex-1 h-10"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
