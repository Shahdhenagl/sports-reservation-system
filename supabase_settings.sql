-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT DEFAULT 'Sports Booking',
  customer_service_phone TEXT DEFAULT '',
  instapay_id TEXT DEFAULT '',
  wallet_number TEXT DEFAULT '',
  deposit_enabled BOOLEAN DEFAULT true,
  min_deposit_percent INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON app_settings FOR ALL USING (true);

-- Insert default row
INSERT INTO app_settings (app_name) VALUES ('Sports Booking');
