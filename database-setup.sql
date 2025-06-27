-- Legal237 Admin Dashboard Database Setup
-- Run this script in your Supabase SQL editor

-- Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  specialization TEXT NOT NULL,
  location TEXT NOT NULL,
  years_experience INTEGER NOT NULL CHECK (years_experience >= 0),
  bar_number TEXT NOT NULL UNIQUE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_records table (if not exists)
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'mobile_money',
  transaction_id TEXT,
  flutterwave_tx_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lawyers_specialization ON lawyers(specialization);
CREATE INDEX IF NOT EXISTS idx_lawyers_location ON lawyers(location);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_document_type ON payment_records(document_type);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);

-- Enable Row Level Security
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lawyers table
-- Allow service role to do everything
CREATE POLICY "Service role can manage lawyers" ON lawyers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read lawyers
CREATE POLICY "Authenticated users can read lawyers" ON lawyers
  FOR SELECT TO authenticated
  USING (true);

-- Create RLS policies for payment_records table
-- Allow service role to do everything
CREATE POLICY "Service role can manage payment records" ON payment_records
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to see their own payment records
CREATE POLICY "Users can see their own payments" ON payment_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own payment records
CREATE POLICY "Users can insert their own payments" ON payment_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert sample lawyers (optional - remove if not needed)
INSERT INTO lawyers (name, email, phone, specialization, location, years_experience, bar_number) VALUES
  ('Maitre Jean Baptiste', 'jean.baptiste@legal237.com', '+237677123456', 'Criminal Law', 'Douala', 15, 'BAR001'),
  ('Maitre Marie Claire', 'marie.claire@legal237.com', '+237678234567', 'Civil Law', 'Yaounde', 12, 'BAR002'),
  ('Maitre Paul Ngassa', 'paul.ngassa@legal237.com', '+237679345678', 'Commercial Law', 'Bamenda', 8, 'BAR003'),
  ('Maitre Grace Nkomo', 'grace.nkomo@legal237.com', '+237680456789', 'Family Law', 'Buea', 10, 'BAR004')
ON CONFLICT (email) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON lawyers TO anon, authenticated;
GRANT SELECT, INSERT ON payment_records TO authenticated;
GRANT ALL ON lawyers TO service_role;
GRANT ALL ON payment_records TO service_role; 