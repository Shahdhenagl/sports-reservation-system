-- Run this SQL in your Supabase SQL Editor

-- 1. Customers table
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

-- 2. Bookings table
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
  payment_type TEXT DEFAULT 'full', -- full, partial
  payment_method TEXT DEFAULT 'instapay', -- instapay, wallet
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  payment_screenshot TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 4. Policies for customers
CREATE POLICY "Allow all for authenticated" ON customers FOR ALL USING (true);
CREATE POLICY "Allow insert for anon" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anon" ON customers FOR SELECT USING (true);

-- 5. Policies for bookings
CREATE POLICY "Allow all for authenticated" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow insert for anon" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anon" ON bookings FOR SELECT USING (true);

-- 6. Create storage bucket for payment screenshots
-- Go to Supabase Dashboard > Storage > Create bucket named "payment-screenshots" and set it to PUBLIC
