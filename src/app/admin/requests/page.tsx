export const dynamic = "force-dynamic";
// استيراد دالة جلب الجلسة من next-auth للتحقق من المستخدم المسجل

// استيراد دالة التوجيه لإعادة توجيه المستخدم لو مش متصرح له
import { redirect } from "next/navigation";

// استيراد إعدادات المصادقة (الأدوار وطريقة تسجيل الدخول)
import { getAppSession } from "@/lib/auth";

// استيراد الـ Supabase Client الخاص بالأدمن (صلاحيات كاملة)
import { supabaseAdmin } from "@/lib/supabase";

// استيراد المكوّن التفاعلي اللي بيعرض الطلبات ويتعامل مع القبول والرفض
import RequestsClient from "./RequestsClient";

// الصفحة الرئيسية لطلبات الالتحاق — Server Component (تشتغل على السيرفر)
export default async function AdminRequestsPage() {

  // جلب بيانات الجلسة الحالية (مين اللي مسجل دخوله دلوقتي)
  const session = await getAppSession();

  // لو مفيش جلسة أو المستخدم مش أدمن — وجّهه لصفحة تسجيل الدخول
  if (!session || session.user.role !== "admin") redirect("/login");

  // تشغيل الـ 3 استعلامات دفعة واحدة بدل ما نستنى كل واحدة على حدة (أسرع)
  const [
    { data: requests }, // الطلبات المعلقة
    { data: coaches },  // قائمة المدربين (للـ modal)
    { data: groups },   // قائمة المجموعات التدريبية (للـ modal)
  ] = await Promise.all([

    // الاستعلام الأول: جلب طلبات الالتحاق المعلقة مع بيانات السباح وولي الأمر
    supabaseAdmin
      .from("enrollment_requests")       // من جدول طلبات الالتحاق
      .select(`
        id,
        swimmer_id,
        receipt_image_url,
        status,
        created_at,
        swimmer:swimmers(
          id,
          name,
          age,
          level,
          parent:parents(
            id,
            name,
            phone
          )
        )
      `)
      .eq("status", "pending")           // فقط الطلبات المعلقة
      .order("created_at", { ascending: true }), // الأقدم أولاً

    // الاستعلام الثاني: جلب المدربين النشطين فقط
    supabaseAdmin
      .from("coaches")                   // من جدول المدربين
      .select("id, name")                // محتاجين بس الـ id والاسم
      .eq("active", true)                // المدربين النشطين فقط
      .order("name"),                    // مرتبين أبجدياً

    // الاستعلام الثالث: جلب المجموعات التدريبية
    supabaseAdmin
      .from("training_groups")           // من جدول المجموعات
      .select("id, coach_id, label")     // محتاجين الـ id والمدرب والاسم
      .order("coach_id"),                // مرتبين حسب المدرب
  ]);

  return (
    // حاوية الصفحة مع padding من كل الجهات
    <div className="p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">

        {/* عنوان الصفحة */}
        <h1 className="text-2xl font-bold text-white">طلبات الالتحاق</h1>

        {/* عدد الطلبات المعلقة — لو requests فارغة يعرض 0 */}
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {requests?.length ?? 0} طلب ينتظر المراجعة
        </p>
      </div>

      {/* تمرير البيانات للمكوّن التفاعلي */}
      <RequestsClient
        initialRequests={(requests ?? []) as unknown as RequestItem[]} // الطلبات المعلقة
        coaches={coaches ?? []}   // قائمة المدربين للـ modal
        groups={groups ?? []}     // قائمة المجموعات للـ modal
      />
    </div>
  );
}

// ==========================================
// تعريف شكل بيانات الطلب الواحد
// بنستخدمه في هذا الملف والـ RequestsClient
// ==========================================
export interface RequestItem {
  id: string;                    // معرف الطلب الفريد
  swimmer_id: string;            // معرف السباح المرتبط بالطلب
  receipt_image_url: string;     // رابط صورة الإيصال المرفوعة
  status: string;                // حالة الطلب (pending / approved / rejected)
  created_at: string;            // تاريخ إنشاء الطلب
  swimmer: {                     // بيانات السباح (علاقة من جدول swimmers)
    id: string;
    name: string;                // اسم السباح
    age: number;                 // عمر السباح
    level: "beginner" | "intermediate" | "advanced"; // مستوى السباح
    parent: {                    // بيانات ولي الأمر (علاقة من جدول parents)
      id: string;
      name: string;              // اسم ولي الأمر
      phone: string;             // رقم هاتف ولي الأمر
    } | null;                    // ممكن يكون null لو مفيش ولي أمر مرتبط
  } | null;                      // ممكن يكون null لو مفيش سباح مرتبط
}
