-- Safe migration script
-- Run this in your Supabase SQL Editor

-- 1. Tables (Created only if they don't exist)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_code TEXT DEFAULT '+20',
  whatsapp TEXT NOT NULL,
  whatsapp_code TEXT DEFAULT '+20',
  total_payments NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  activity_id UUID REFERENCES activities(id),
  activity_name TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  players_count INTEGER DEFAULT 1,
  total_price NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  payment_type TEXT DEFAULT 'full',
  payment_method TEXT DEFAULT 'instapay',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partially_paid')),
  rejection_reason TEXT,
  payment_screenshot TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add columns if table already existed but columns are missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='amount_paid') THEN
        ALTER TABLE bookings ADD COLUMN amount_paid NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_type') THEN
        ALTER TABLE bookings ADD COLUMN payment_type TEXT DEFAULT 'full';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_method') THEN
        ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT 'instapay';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='rejection_reason') THEN
        ALTER TABLE bookings ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Activities operating hours columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='open_time') THEN
        ALTER TABLE activities ADD COLUMN open_time TEXT DEFAULT '08:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='close_time') THEN
        ALTER TABLE activities ADD COLUMN close_time TEXT DEFAULT '22:00';
    END IF;
END $$;

-- Drop and recreate status check constraint to ensure partially_paid is allowed on existing databases
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'partially_paid'));

-- 3. Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Policies Safely
DROP POLICY IF EXISTS "Allow all for authenticated" ON customers;
DROP POLICY IF EXISTS "Allow insert for anon" ON customers;
DROP POLICY IF EXISTS "Allow select for anon" ON customers;
CREATE POLICY "Allow all for authenticated" ON customers FOR ALL USING (true);
CREATE POLICY "Allow insert for anon" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anon" ON customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON bookings;
DROP POLICY IF EXISTS "Allow insert for anon" ON bookings;
DROP POLICY IF EXISTS "Allow select for anon" ON bookings;
CREATE POLICY "Allow all for authenticated" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow insert for anon" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anon" ON bookings FOR SELECT USING (true);
