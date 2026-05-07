/**
 * ==========================================
 * أداة محاكاة التاريخ للاختبار
 * ==========================================
 * الاستخدام الطبيعي: بترجع new Date() الحقيقي
 *
 * لمحاكاة تاريخ معين (مثلاً بداية شهر جديد):
 *   أضف في .env.local:  SIMULATE_DATE=2026-06-01
 *   وشغّل npm run dev
 *
 * ملاحظة: .env.local مش بيترفع على GitHub أو Vercel
 *   إنتاج = دايماً التاريخ الحقيقي (SIMULATE_DATE غير موجود)
 * ==========================================
 */
export function simulatedNow(): Date {
  if (process.env.SIMULATE_DATE) {
    const d = new Date(process.env.SIMULATE_DATE);
    // تحقق من صحة التاريخ
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}
