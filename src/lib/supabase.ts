import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ==========================================
// Lazy Initialization — ليه؟
// ==========================================
// المشكلة: لو عملنا createClient() مباشرة وقت تحميل الملف،
// ممكن تكون متغيرات البيئة (env vars) لسه مش محملة بعد
// (خصوصاً في Client Components في المتصفح).
//
// الحل: نستخدم pattern اسمه "Lazy Singleton" —
// الـ client مش بيتعمل إلا أول مرة محتاجينه فعلاً،
// وبعدها يتخزن ويتستخدم من غير ما يتعمل تاني.
// ==========================================

// متغيرات خاصة لتخزين الـ clients بعد أول إنشاء
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// ==========================================
// Client العادي — للاستخدام في الـ Frontend
// يعمل بصلاحيات المستخدم المسجل دخوله فقط
// ==========================================
export function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "متغيرات Supabase مش موجودة: تأكد من NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف .env.local"
    );
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// ==========================================
// Client المدير — للاستخدام في الـ Backend فقط (API Routes)
// يتجاوز قواعد الأمان ويملك صلاحيات كاملة
// لا تستخدمه أبداً في مكونات الـ Frontend
// ==========================================
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "متغيرات Supabase Admin مش موجودة: تأكد من SUPABASE_SERVICE_ROLE_KEY في ملف .env.local"
    );
  }

  _supabaseAdmin = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _supabaseAdmin;
}

// ==========================================
// Shorthand exports — للاستخدام البسيط
// supabase      → في الـ Frontend
// supabaseAdmin → في الـ Backend فقط
// ==========================================
export const supabase = {
  get storage() { return getSupabaseClient().storage; },
  get auth()    { return getSupabaseClient().auth; },
  from: (table: string) => getSupabaseClient().from(table),
};

export const supabaseAdmin = {
  get storage() { return getSupabaseAdmin().storage; },
  get auth()    { return getSupabaseAdmin().auth; },
  from: (table: string) => getSupabaseAdmin().from(table),
};
