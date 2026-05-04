// تحديد إن المكوّن ده Client Component
"use client";

// استيراد useState لإدارة الحالة
import { useState } from "react";

// استيراد الأيقونات
import {
  Plus,          // أيقونة إضافة مجموعة
  Trash2,        // أيقونة حذف المجموعة
  UsersRound,    // أيقونة المجموعة (الحالة الفارغة)
  X,             // أيقونة إغلاق الـ modal
  Loader2,       // أيقونة التحميل
  Users,         // أيقونة عدد السباحين
  GraduationCap, // أيقونة المدرب
  Calendar,      // أيقونة نمط الأيام
  Clock,         // أيقونة الوقت
} from "lucide-react";

// استيراد مكونات shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// استيراد أنواع البيانات
import type { GroupItem, CoachOption } from "./page";

// ==========================================
// ترجمة نمط الأيام للعربية
// ==========================================
const dayPatternLabels: Record<string, string> = {
  SAT_MON_WED: "سبت / اثنين / أربعاء", // أيام الفريق الأول
  SUN_TUE_THU: "أحد / ثلاثاء / خميس",  // أيام الفريق الثاني
};

// ==========================================
// ترجمة الفترة الزمنية للعربية
// ==========================================
const timeSlotLabels: Record<string, string> = {
  slot1: "الفترة الأولى",  // الفترة الصباحية
  slot2: "الفترة الثانية", // الفترة المسائية الأولى
  slot3: "الفترة الثالثة", // الفترة المسائية الثانية
};

// ==========================================
// Props المكوّن الرئيسي
// ==========================================
interface GroupsClientProps {
  initialGroups: GroupItem[]; // المجموعات من السيرفر
  coaches: CoachOption[];     // قائمة المدربين للـ dropdown
}

// ==========================================
// شكل بيانات فورم إضافة مجموعة جديدة
// ==========================================
interface NewGroupForm {
  coach_id: string;    // المدرب المسؤول
  day_pattern: string; // نمط الأيام (SAT_MON_WED أو SUN_TUE_THU)
  time_slot: string;   // الفترة (slot1 أو slot2 أو slot3)
  time: string;        // الوقت الفعلي (مثال: 8:00 ص) يكتبه الأدمن
}

// ==========================================
// المكوّن الرئيسي
// ==========================================
export default function GroupsClient({ initialGroups, coaches }: GroupsClientProps) {

  // قائمة المجموعات — بتتحدث عند الإضافة والحذف
  const [groups, setGroups] = useState(initialGroups);

  // حالة modal إضافة مجموعة
  const [addModal, setAddModal] = useState(false);

  // بيانات فورم الإضافة
  const [form, setForm] = useState<NewGroupForm>({
    coach_id: "",
    day_pattern: "",
    time_slot: "",
    time: "",
  });

  // حالة modal تأكيد الحذف
  const [deleteModal, setDeleteModal] = useState<{
    groupId: string;       // معرف المجموعة
    label: string;         // اسم المجموعة للعرض
    swimmerCount: number;  // عدد السباحين للتحذير
  } | null>(null);

  // حالة التحميل أثناء الإرسال
  const [submitting, setSubmitting] = useState(false);

  // رسالة الخطأ
  const [formError, setFormError] = useState<string | null>(null);

  // ==========================================
  // توليد الاسم التلقائي للمجموعة من الاختيارات
  // مثال: "سبت / اثنين / أربعاء — 8:00 ص"
  // ==========================================
  const generateLabel = (dayPattern: string, time: string): string => {
    const dayLabel = dayPatternLabels[dayPattern] ?? dayPattern; // ترجمة الأيام
    return `${dayLabel} — ${time}`;                              // دمجهم مع الوقت
  };

  // ==========================================
  // دالة تحديث حقول الفورم
  // ==========================================
  const updateForm = (field: keyof NewGroupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ==========================================
  // فتح modal الإضافة وإعادة تعيين الفورم
  // ==========================================
  const openAddModal = () => {
    setForm({ coach_id: "", day_pattern: "", time_slot: "", time: "" });
    setFormError(null);
    setAddModal(true);
  };

  // ==========================================
  // إرسال فورم إضافة المجموعة
  // ==========================================
  const handleAdd = async () => {

    // التحقق من ملء كل الحقول
    if (!form.coach_id || !form.day_pattern || !form.time_slot || !form.time.trim()) {
      setFormError("يرجى ملء جميع الحقول");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    // توليد الاسم التلقائي قبل الإرسال
    const label = generateLabel(form.day_pattern, form.time.trim());

    // إرسال البيانات للـ API
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coach_id: form.coach_id,
        day_pattern: form.day_pattern,
        time_slot: form.time_slot,
        label, // الاسم المولّد تلقائياً
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "حدث خطأ، يرجى المحاولة");
      return;
    }

    const data = await res.json();

    // إيجاد بيانات المدرب المختار من القائمة
    const selectedCoach = coaches.find((c) => c.id === form.coach_id);

    // إضافة المجموعة الجديدة للقائمة بدون reload
    setGroups((prev) => [
      ...prev,
      {
        id: data.group.id,
        coach_id: form.coach_id,
        day_pattern: form.day_pattern as GroupItem["day_pattern"],
        time_slot: form.time_slot as GroupItem["time_slot"],
        label,
        created_at: new Date().toISOString(),
        coach: selectedCoach ? { id: selectedCoach.id, name: selectedCoach.name } : null,
        swimmers: [{ count: 0 }], // مجموعة جديدة — مفيش سباحين بعد
      },
    ]);

    setAddModal(false);
  };

  // ==========================================
  // تأكيد حذف المجموعة
  // ==========================================
  const handleDelete = async () => {
    if (!deleteModal) return;

    setSubmitting(true);
    setFormError(null);

    const res = await fetch(`/api/admin/groups/${deleteModal.groupId}`, {
      method: "DELETE",
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "حدث خطأ أثناء الحذف");
      return;
    }

    // إزالة المجموعة من القائمة
    setGroups((prev) => prev.filter((g) => g.id !== deleteModal.groupId));
    setDeleteModal(null);
  };

  // ==========================================
  // تجميع المجموعات حسب المدرب للعرض
  // بدل ما نعرض قائمة عشوائية، نجمّع مجموعات كل مدرب مع بعض
  // ==========================================
  const groupsByCoach = groups.reduce<Record<string, { coachName: string; items: GroupItem[] }>>(
    (acc, group) => {
      const coachId = group.coach_id;
      const coachName = group.coach?.name ?? "مدرب غير معروف";

      // لو المدرب ده لسه مش موجود في الـ accumulator — أضفه
      if (!acc[coachId]) {
        acc[coachId] = { coachName, items: [] };
      }

      // أضف المجموعة لقائمة مجموعات المدرب ده
      acc[coachId].items.push(group);
      return acc;
    },
    {}
  );

  return (
    <>
      {/* ==========================================
          رأس القسم — زرار إضافة مجموعة
          ========================================== */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={openAddModal}
          disabled={coaches.length === 0} // معطّل لو مفيش مدربين
          className="flex items-center gap-2 font-semibold h-10 px-5"
          style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
        >
          <Plus className="w-4 h-4" />
          إضافة مجموعة جديدة
        </Button>
      </div>

      {/* تحذير لو مفيش مدربين */}
      {coaches.length === 0 && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid oklch(0.78 0.16 75 / 30%)" }}
        >
          ⚠️ لا يوجد مدربون — أضف مدرباً أولاً من صفحة المدربين
        </div>
      )}

      {/* ==========================================
          الحالة الفارغة
          ========================================== */}
      {groups.length === 0 ? (
        <div
          className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--cyan-muted)" }}
          >
            <UsersRound className="w-8 h-8" style={{ color: "var(--cyan)" }} />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">لا توجد مجموعات بعد</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              اضغط "إضافة مجموعة جديدة" للبدء
            </p>
          </div>
        </div>
      ) : (

        // ==========================================
        // عرض المجموعات مجمّعة حسب المدرب
        // ==========================================
        <div className="space-y-8">
          {Object.entries(groupsByCoach).map(([coachId, { coachName, items }]) => (

            // قسم مجموعات كل مدرب
            <div key={coachId}>

              {/* اسم المدرب كعنوان للقسم */}
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4" style={{ color: "var(--cyan)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--cyan)" }}>
                  {coachName}
                </h2>
                {/* عدد مجموعات المدرب */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--cyan-muted)", color: "var(--cyan)" }}
                >
                  {items.length} مجموعة
                </span>
              </div>

              {/* شبكة بطاقات مجموعات هذا المدرب */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((group) => {

                  // عدد السباحين في هذه المجموعة
                  const swimmerCount = group.swimmers[0]?.count ?? 0;

                  return (
                    // بطاقة المجموعة
                    <div
                      key={group.id}
                      className="rounded-2xl p-5 border"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      {/* رأس البطاقة — الاسم وزرار الحذف */}
                      <div className="flex items-start justify-between mb-4">

                        {/* اسم المجموعة */}
                        <p className="text-sm font-semibold text-white leading-snug">
                          {group.label}
                        </p>

                        {/* زرار الحذف */}
                        <button
                          onClick={() => setDeleteModal({
                            groupId: group.id,
                            label: group.label,
                            swimmerCount,
                          })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0 mr-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--destructive)" }} />
                        </button>
                      </div>

                      {/* تفاصيل المجموعة */}
                      <div className="space-y-2">

                        {/* نمط الأيام */}
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                          <span style={{ color: "var(--muted-foreground)" }}>
                            {dayPatternLabels[group.day_pattern]}
                          </span>
                        </div>

                        {/* الفترة الزمنية */}
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                          <span style={{ color: "var(--muted-foreground)" }}>
                            {timeSlotLabels[group.time_slot]}
                          </span>
                        </div>

                        {/* عدد السباحين */}
                        <div className="flex items-center gap-2 text-xs">
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
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          Modal إضافة مجموعة جديدة
          ========================================== */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setAddModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                <h2 className="text-lg font-semibold text-white">إضافة مجموعة جديدة</h2>
              </div>
              <button
                onClick={() => setAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            <div className="space-y-4">

              {/* اختيار المدرب */}
              <div className="space-y-1.5">
                <Label className="text-white">المدرب</Label>
                <select
                  value={form.coach_id}
                  onChange={(e) => updateForm("coach_id", e.target.value)}
                  className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                  style={{
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    color: form.coach_id ? "white" : "var(--muted-foreground)",
                  }}
                >
                  <option value="" disabled>اختر المدرب...</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}
                      style={{ background: "var(--card)", color: "white" }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* اختيار نمط الأيام */}
              <div className="space-y-1.5">
                <Label className="text-white">نمط الأيام</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* خيار سبت/اثنين/أربعاء */}
                  {["SAT_MON_WED", "SUN_TUE_THU"].map((pattern) => (
                    <label key={pattern} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="day_pattern"
                        value={pattern}
                        checked={form.day_pattern === pattern}
                        onChange={(e) => updateForm("day_pattern", e.target.value)}
                        className="peer sr-only" // إخفاء الـ radio الافتراضي
                      />
                      {/* بطاقة الاختيار — تتغير مظهرها عند التحديد */}
                      <div
                        className="rounded-xl p-3 text-center text-xs font-medium border transition-all duration-200 peer-checked:border-cyan-500 peer-checked:text-white"
                        style={{
                          background: form.day_pattern === pattern ? "var(--cyan-muted)" : "var(--secondary)",
                          borderColor: form.day_pattern === pattern ? "var(--cyan)" : "var(--border)",
                          color: form.day_pattern === pattern ? "var(--cyan)" : "var(--muted-foreground)",
                        }}
                      >
                        {dayPatternLabels[pattern]}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* اختيار الفترة الزمنية */}
              <div className="space-y-1.5">
                <Label className="text-white">الفترة الزمنية</Label>
                <div className="grid grid-cols-3 gap-3">
                  {["slot1", "slot2", "slot3"].map((slot) => (
                    <label key={slot} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="time_slot"
                        value={slot}
                        checked={form.time_slot === slot}
                        onChange={(e) => updateForm("time_slot", e.target.value)}
                        className="peer sr-only"
                      />
                      <div
                        className="rounded-xl p-3 text-center text-xs font-medium border transition-all duration-200"
                        style={{
                          background: form.time_slot === slot ? "var(--cyan-muted)" : "var(--secondary)",
                          borderColor: form.time_slot === slot ? "var(--cyan)" : "var(--border)",
                          color: form.time_slot === slot ? "var(--cyan)" : "var(--muted-foreground)",
                        }}
                      >
                        {timeSlotLabels[slot]}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* حقل الوقت */}
              <div className="space-y-1.5">
                <Label className="text-white">الوقت</Label>
                <Input
                  placeholder="مثال: 8:00 ص أو 4:00 م"
                  value={form.time}
                  onChange={(e) => updateForm("time", e.target.value)}
                  className="bg-secondary border-border text-white placeholder:text-muted-foreground"
                />
              </div>

              {/* معاينة الاسم المولّد */}
              {form.day_pattern && form.time.trim() && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ background: "var(--cyan-muted)", color: "var(--cyan)", border: "1px solid oklch(0.72 0.18 195 / 30%)" }}
                >
                  {/* عرض الاسم كما سيظهر في النظام */}
                  الاسم: <span className="font-semibold">{generateLabel(form.day_pattern, form.time)}</span>
                </div>
              )}

              {/* رسالة الخطأ */}
              {formError && (
                <p className="text-sm rounded-lg p-3"
                  style={{ background: "oklch(0.65 0.22 25 / 15%)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.65 0.22 25 / 30%)" }}>
                  {formError}
                </p>
              )}

              {/* أزرار الإضافة والإلغاء */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAdd}
                  disabled={submitting}
                  className="flex-1 font-semibold h-10"
                  style={{ background: "var(--cyan)", color: "var(--cyan-foreground)" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة المجموعة"}
                </Button>
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
          Modal تأكيد الحذف
          ========================================== */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" style={{ color: "var(--destructive)" }} />
                <h2 className="text-lg font-semibold text-white">حذف المجموعة</h2>
              </div>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* نص التأكيد */}
            <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
              هل تريد حذف مجموعة{" "}
              <span className="text-white font-semibold">"{deleteModal.label}"</span>؟
            </p>

            {/* تحذير لو فيه سباحين في المجموعة */}
            {deleteModal.swimmerCount > 0 && (
              <div
                className="rounded-lg p-3 mb-4 text-sm"
                style={{ background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid oklch(0.78 0.16 75 / 30%)" }}
              >
                ⚠️ هذه المجموعة تحتوي على {deleteModal.swimmerCount} سباح — سيتم إلغاء ارتباطهم
                بالمجموعة وستحتاج لإعادة تعيينهم
              </div>
            )}

            {/* رسالة الخطأ */}
            {formError && (
              <p className="text-sm rounded-lg p-3 mb-4"
                style={{ background: "oklch(0.65 0.22 25 / 15%)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.65 0.22 25 / 30%)" }}>
                {formError}
              </p>
            )}

            {/* أزرار التأكيد والإلغاء */}
            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 font-semibold h-10"
                style={{ background: "var(--destructive)", color: "white" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحذف"}
              </Button>
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
