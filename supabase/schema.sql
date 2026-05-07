-- ==========================================
-- SQL Schema - أكاديمية طنطا للسباحة
-- انسخ هذا الملف كله وشغّله في Supabase SQL Editor
-- ==========================================

-- تفعيل UUID لتوليد معرفات فريدة تلقائياً
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- جدول المستخدمين الرئيسي
-- يحتوي على بيانات الدخول لكل الأدوار
-- ==========================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- كلمة السر مشفرة بـ bcrypt
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'parent')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- جدول المدربين
-- مرتبط بجدول users برابط واحد لواحد
-- ==========================================
CREATE TABLE coaches (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  phone    TEXT,
  active   BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id)  -- كل مستخدم له مدرب واحد فقط
);

-- ==========================================
-- جدول أولياء الأمور
-- مرتبط بجدول users برابط واحد لواحد
-- ==========================================
CREATE TABLE parents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  national_id TEXT,
  UNIQUE(user_id)
);

-- ==========================================
-- جدول المجموعات التدريبية
-- كل مجموعة تابعة لمدرب وتحتوي على نمط أيام وفترة زمنية
-- ==========================================
CREATE TABLE training_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  day_pattern TEXT NOT NULL CHECK (day_pattern IN ('SAT_MON_WED', 'SUN_TUE_THU')),
  time_slot   TEXT NOT NULL CHECK (time_slot IN ('slot1', 'slot2', 'slot3')),
  -- الاسم المعروض: مثال "سبت/اثنين/أربعاء - 8:00 صباحاً"
  label       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- جدول السباحين
-- مرتبط بولي الأمر والمدرب والمجموعة
-- ==========================================
CREATE TABLE swimmers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id      UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  age            INTEGER NOT NULL CHECK (age > 0 AND age < 100),
  level          TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  -- المدرب والمجموعة قابلان للـ NULL (عند الانتظار أو عند حذف مدرب)
  coach_id       UUID REFERENCES coaches(id) ON DELETE SET NULL,
  group_id       UUID REFERENCES training_groups(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  -- حالة الدفع للشهر الحالي (تُحدَّث تلقائياً في بداية كل شهر)
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- جدول طلبات الالتحاق
-- يُنشأ عند رفع ولي الأمر إيصال الالتحاق الأول
-- ==========================================
CREATE TABLE enrollment_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swimmer_id        UUID NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  receipt_image_url TEXT NOT NULL,   -- رابط الصورة في Supabase Storage
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes             TEXT,            -- ملاحظة الإدارة عند الرفض
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- جدول المدفوعات الشهرية
-- كل سجل يمثل إيصال شهر معين لسباح معين
-- ==========================================
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swimmer_id        UUID NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  month             INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year              INTEGER NOT NULL CHECK (year > 2020),
  receipt_image_url TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_note    TEXT,                        -- سبب الرفض — يكتبه الأدمن عند رفض الإيصال
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  -- منع تكرار الدفع للشهر نفسه لنفس السباح
  UNIQUE(swimmer_id, month, year)
);

-- ==========================================
-- Indexes لتسريع استعلامات البحث الشائعة
-- ==========================================
CREATE INDEX idx_swimmers_parent    ON swimmers(parent_id);
CREATE INDEX idx_swimmers_coach     ON swimmers(coach_id);
CREATE INDEX idx_swimmers_status    ON swimmers(status);
CREATE INDEX idx_payments_swimmer   ON payments(swimmer_id);
CREATE INDEX idx_payments_month_year ON payments(month, year);
CREATE INDEX idx_enrollment_status  ON enrollment_requests(status);

-- ==========================================
-- Function: إعادة تعيين حالة الدفع في بداية كل شهر
-- هذه الدالة ستُشغَّل عبر Supabase Cron Job
-- ==========================================
CREATE OR REPLACE FUNCTION reset_payment_status()
RETURNS void AS $$
BEGIN
  -- تحديث كل السباحين النشطين إلى "غير مدفوع"
  UPDATE swimmers
  SET payment_status = 'unpaid'
  WHERE status = 'active';

  RAISE LOG 'تم إعادة تعيين حالة الدفع لجميع السباحين النشطين';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- إدراج حساب الأدمن الافتراضي
-- ⚠️  يجب تغيير كلمة السر فوراً بعد أول تسجيل دخول!
-- ⚠️  لا تُستخدم بيانات الاعتماد الافتراضية في بيئة الإنتاج
-- الكلمة الافتراضية موثقة في ملف .env.local المحلي فقط
-- ==========================================
INSERT INTO users (email, password_hash, name, phone, role)
VALUES (
  'admin@tanta-swimming.com',
  '$2b$12$ycgm52V3lHoO7wCKWUQJJ.OjnnN8ggA94uw0EkhPZWxIkXWzYFfcC',
  'مدير الأكاديمية',
  '0100000000',
  'admin'
);

-- ==========================================
-- Storage Buckets - مجلدات رفع الصور
-- شغّل هذا في Supabase SQL Editor أيضاً
-- ==========================================

-- مجلد إيصالات الالتحاق
INSERT INTO storage.buckets (id, name, public)
VALUES ('enrollment-receipts', 'enrollment-receipts', false)
ON CONFLICT DO NOTHING;

-- مجلد إيصالات المدفوعات الشهرية
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT DO NOTHING;

-- ==========================================
-- جدول توكنات إعادة تعيين كلمة المرور
-- ينشأ التوكن عند طلب الأدمن، ويُحذف فور استخدامه أو انتهائه
-- ==========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index للبحث السريع بالتوكن عند التحقق منه
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token   ON password_reset_tokens(token);
-- Index لتنظيف التوكنات المنتهية الصلاحية
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ==========================================
-- Row Level Security (RLS) - قواعد أمان البيانات
-- تمنع المستخدمين من الوصول لبيانات بعضهم
-- ==========================================

-- تفعيل RLS على كل الجداول
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimmers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;

-- الأدمن يرى كل شيء (نستخدم service_role key في الكود للأدمن)
-- ولي الأمر يرى بياناته فقط
-- المدرب يرى سباحيه فقط

-- ملاحظة: نستخدم supabaseAdmin (service role) في كل API Routes
-- لذلك RLS لن تطبق على الـ Server - فقط حماية إضافية
