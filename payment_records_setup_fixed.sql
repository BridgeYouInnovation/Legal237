-- Payment Records Table Setup for Subscriptions (Fixed Version)
-- Run this script in your Supabase SQL editor

-- Create payment_records table with nullable user_id for sample data
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

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_records_user_id') THEN
        CREATE INDEX idx_payment_records_user_id ON payment_records(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_records_status') THEN
        CREATE INDEX idx_payment_records_status ON payment_records(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_records_document_type') THEN
        CREATE INDEX idx_payment_records_document_type ON payment_records(document_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_records_created_at') THEN
        CREATE INDEX idx_payment_records_created_at ON payment_records(created_at);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Service role can manage payment records" ON payment_records;
DROP POLICY IF EXISTS "Users can see their own payments" ON payment_records;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payment_records;

-- Create RLS policies for payment_records table
CREATE POLICY "Service role can manage payment records" ON payment_records
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can see their own payments" ON payment_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payment_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp (replace if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT ON payment_records TO authenticated;
GRANT ALL ON payment_records TO service_role;

-- Insert sample payment records using existing user IDs or NULL
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM payment_records LIMIT 1) THEN
        -- Try to get an existing user ID
        SELECT id INTO existing_user_id FROM auth.users LIMIT 1;
        
        -- If no users exist, create sample records with NULL user_id (for demo purposes)
        IF existing_user_id IS NULL THEN
            INSERT INTO payment_records (user_id, document_type, amount, currency, status, payment_method, transaction_id, flutterwave_tx_ref) VALUES
              (NULL, 'penal_code', 2500.00, 'XAF', 'completed', 'mobile_money', 'TXN001', 'FLW_REF001'),
              (NULL, 'criminal_procedure', 2500.00, 'XAF', 'completed', 'mobile_money', 'TXN002', 'FLW_REF002'),
              (NULL, 'penal_code', 2500.00, 'XAF', 'pending', 'mobile_money', 'TXN003', 'FLW_REF003'),
              (NULL, 'criminal_procedure', 2500.00, 'XAF', 'failed', 'mobile_money', 'TXN004', 'FLW_REF004');
        ELSE
            -- Use existing user ID for sample records
            INSERT INTO payment_records (user_id, document_type, amount, currency, status, payment_method, transaction_id, flutterwave_tx_ref) VALUES
              (existing_user_id, 'penal_code', 2500.00, 'XAF', 'completed', 'mobile_money', 'TXN001', 'FLW_REF001'),
              (existing_user_id, 'criminal_procedure', 2500.00, 'XAF', 'completed', 'mobile_money', 'TXN002', 'FLW_REF002'),
              (existing_user_id, 'penal_code', 2500.00, 'XAF', 'pending', 'mobile_money', 'TXN003', 'FLW_REF003'),
              (existing_user_id, 'criminal_procedure', 2500.00, 'XAF', 'failed', 'mobile_money', 'TXN004', 'FLW_REF004');
        END IF;
    END IF;
END $$; 