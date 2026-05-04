-- ==========================================
-- Storage Buckets للإيصالات
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('enrollment-receipts', 'enrollment-receipts', true),
  ('payment-receipts',    'payment-receipts',    true);