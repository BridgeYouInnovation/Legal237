-- Payment Records Table Setup for Subscriptions
-- Run this script in your Supabase SQL editor

-- Create payment_records table
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
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_document_type ON payment_records(document_type);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);

-- Enable Row Level Security
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

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

-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT ON payment_records TO authenticated;
GRANT ALL ON payment_records TO service_role;

-- Insert some sample payment records for testing (optional)
INSERT INTO payment_records (user_id, document_type, amount, currency, status, payment_method, transaction_id, flutterwave_tx_ref) VALUES
  (gen_random_uuid(), 'penal_code', 2500.00, 'XAF', 'completed', 'mobile_money', 'TXN001', 'FLW_REF001'),
  (gen_random_uuid(), 'criminal_procedure', 2500.00, 'XAF', 'completed', 'mobile_money', 'TXN002', 'FLW_REF002'),
  (gen_random_uuid(), 'penal_code', 2500.00, 'XAF', 'pending', 'mobile_money', 'TXN003', 'FLW_REF003'),
  (gen_random_uuid(), 'criminal_procedure', 2500.00, 'XAF', 'failed', 'mobile_money', 'TXN004', 'FLW_REF004')
ON CONFLICT (id) DO NOTHING; 