export const dynamic = "force-dynamic";
// استيراد دالة جلب الجلسة للتحقق من المستخدم المسجل

// استيراد دالة التوجيه لإعادة توجيه المستخدم غير المصرح له
import { redirect } from "next/navigation";

// استيراد إعدادات المصادقة
import { getAppSession } from "@/lib/auth";

// استيراد الـ Supabase Client بصلاحيات كاملة
import { supabaseAdmin } from "@/lib/supabase";

// استيراد المكوّن التفاعلي للمدفوعات
import PaymentsClient from "./PaymentsClient";

// صفحة مراجعة المدفوعات الشهرية — Server Component
export default async function AdminPaymentsPage() {

  // التحقق من أن المستخدم مسجل دخوله وله صلاحية الأدمن
  const session = await getAppSession();
  if (!session || session.user.role !== "admin") redirect("/login");

  // جلب المدفوعات المعلقة مع بيانات السباح وولي الأمر
  const { data: payments } = await supabaseAdmin
    .from("payments")                // من جدول المدفوعات
    .select(`
      id,
      swimmer_id,
      month,
      year,
      receipt_image_url,
      status,
      created_at,
      swimmer:swimmers(
        id,
        name,
        parent:parents(
          id,
          name,
          phone
        )
      )
    `)
    .eq("status", "pending")         // فقط المدفوعات المعلقة
    .order("created_at", { ascending: true }); // الأقدم أولاً

  return (
    // حاوية الصفحة
    <div className="p-4 md:p-8">

      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">المدفوعات الشهرية</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {payments?.length ?? 0} إيصال ينتظر المراجعة
        </p>
      </div>

      {/* المكوّن التفاعلي — يستقبل المدفوعات المعلقة */}
      <PaymentsClient
        initialPayments={(payments ?? []) as unknown as PaymentItem[]}
      />
    </div>
  );
}

// ==========================================
// تعريف شكل بيانات الدفعة الواحدة
// ==========================================
export interface PaymentItem {
  id: string;                  // معرف الدفعة
  swimmer_id: string;          // معرف السباح
  month: number;               // رقم الشهر (1-12)
  year: number;                // السنة
  receipt_image_url: string;   // رابط صورة الإيصال
  status: string;              // حالة الدفعة
  created_at: string;          // تاريخ الرفع
  swimmer: {
    id: string;
    name: string;              // اسم السباح
    parent: {
      id: string;
      name: string;            // اسم ولي الأمر
      phone: string;           // رقم ولي الأمر
    } | null;
  } | null;
}
