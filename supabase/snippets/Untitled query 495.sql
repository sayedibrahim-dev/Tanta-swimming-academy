-- ==========================================
-- 1. UUID Extension
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. جدول المستخدمين (تسجيل الدخول)
-- ==========================================
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  phone         TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('admin', 'coach', 'parent')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. جدول أولياء الأمور
-- ==========================================
CREATE TABLE parents (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  national_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. جدول المدربين
-- ==========================================
CREATE TABLE coaches (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  active     BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. جدول المجموعات التدريبية
-- ==========================================
CREATE TABLE training_groups (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id    UUID        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  day_pattern TEXT        NOT NULL CHECK (day_pattern IN ('SAT_MON_WED', 'SUN_TUE_THU')),
  time_slot   TEXT        NOT NULL CHECK (time_slot IN ('slot1', 'slot2', 'slot3')),
  label       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, day_pattern, time_slot)
);

-- ==========================================
-- 6. جدول السباحين
-- ==========================================
CREATE TABLE swimmers (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id      UUID        NOT NULL REFERENCES parents(id),
  coach_id       UUID        REFERENCES coaches(id) ON DELETE SET NULL,
  group_id       UUID        REFERENCES training_groups(id) ON DELETE SET NULL,
  name           TEXT        NOT NULL,
  age            INTEGER     NOT NULL CHECK (age >= 4 AND age <= 60),
  level          TEXT        NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  payment_status TEXT        NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. جدول طلبات الالتحاق
-- ==========================================
CREATE TABLE enrollment_requests (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  swimmer_id        UUID        NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  receipt_image_url TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes             TEXT,
  reviewed_by       UUID        REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. جدول المدفوعات الشهرية
-- ==========================================
CREATE TABLE payments (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  swimmer_id        UUID        NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  month             INTEGER     NOT NULL CHECK (month >= 1 AND month <= 12),
  year              INTEGER     NOT NULL CHECK (year >= 2024),
  receipt_image_url TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by       UUID        REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swimmer_id, month, year)
);

-- ==========================================
-- 9. إنشاء حساب الأدمن
-- الباسورد: Admin@2026
-- ==========================================
INSERT INTO users (email, password_hash, name, phone, role)
VALUES (
  'admin@tanat.com',
  '$2b$12$uI8/dTlytoVKD5IW0QKc9uaWpOWga8UeT7Iuzl2/PnZ4N2vwKJSy2',
  'مدير النظام',
  '01000000000',
  'admin'
);