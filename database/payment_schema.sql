-- Legal237 Platform - Payment and Document Access Schema
-- Run this script in your Supabase SQL editor

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',
    payment_method VARCHAR(20) NOT NULL,
    language VARCHAR(2) DEFAULT 'en',
    user_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    payment_url TEXT,
    webhook_data JSONB,
    webhook_received_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    failure_reason TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    test_webhook_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Access Table
CREATE TABLE IF NOT EXISTS document_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    transaction_id UUID REFERENCES payment_transactions(id),
    status VARCHAR(20) DEFAULT 'active',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate access
    UNIQUE(user_id, document_type)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(payment_reference);

CREATE INDEX IF NOT EXISTS idx_document_access_user_id ON document_access(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_document_type ON document_access(document_type);
CREATE INDEX IF NOT EXISTS idx_document_access_status ON document_access(status);
CREATE INDEX IF NOT EXISTS idx_document_access_transaction_id ON document_access(transaction_id);

-- Row Level Security (RLS) Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can only see their own document access
CREATE POLICY "Users can view own document access" ON document_access
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Service role can access everything (for backend operations)
CREATE POLICY "Service role full access to transactions" ON payment_transactions
    FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

CREATE POLICY "Service role full access to document access" ON document_access
    FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_access_updated_at 
    BEFORE UPDATE ON document_access 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for easier data access
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    pt.id,
    pt.document_type,
    pt.customer_name,
    pt.customer_email,
    pt.amount,
    pt.currency,
    pt.payment_method,
    pt.status,
    pt.created_at,
    pt.paid_at,
    da.granted_at as document_access_granted
FROM payment_transactions pt
LEFT JOIN document_access da ON pt.id = da.transaction_id;

-- Insert sample document types
INSERT INTO document_access (user_id, document_type, status, granted_at)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'penal_code', 'active', NOW()),
    ('00000000-0000-0000-0000-000000000000', 'criminal_procedure', 'active', NOW())
ON CONFLICT (user_id, document_type) DO NOTHING; 