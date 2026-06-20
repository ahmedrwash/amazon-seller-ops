-- Enterprise Authorization Migration
-- Generated: 2024-01-16

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changes jsonb, -- Calculated diff
  reason text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create user_marketplaces join table
CREATE TABLE IF NOT EXISTS user_marketplaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_id uuid REFERENCES marketplaces(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, marketplace_id)
);

-- 3. Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS allowed_marketplace_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS can_manage_users boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_finance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 4. Add ownership and audit fields
DO $$ 
DECLARE 
    tables text[] := ARRAY['products', 'tasks', 'compliance_items', 'cost_entries', 'pnl_monthly', 'financial_targets', 'suppliers', 'inventory'];
    t text;
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)', t);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id)', t);
        -- created_by and created_at usually exist, but ensuring
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id)', t);
    END LOOP;
END $$;

-- 5. RLS Policies

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_marketplaces ENABLE ROW LEVEL SECURITY;

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User Marketplaces Policies
DROP POLICY IF EXISTS "Admins can manage user_marketplaces" ON user_marketplaces;
CREATE POLICY "Admins can manage user_marketplaces" ON user_marketplaces USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own user_marketplaces" ON user_marketplaces;
CREATE POLICY "Users can view own user_marketplaces" ON user_marketplaces FOR SELECT USING (auth.uid() = user_id);

-- 6. Storage Policies (Fixed)
-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Authenticated users can read objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete objects" ON storage.objects;

-- Read Policy (SELECT) - Uses USING
CREATE POLICY "Authenticated users can read objects" 
ON storage.objects FOR SELECT 
USING (auth.role() = 'authenticated');

-- Upload Policy (INSERT) - Uses WITH CHECK
CREATE POLICY "Authenticated users can upload objects" 
ON storage.objects FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Update Policy (UPDATE) - Uses USING and WITH CHECK
CREATE POLICY "Authenticated users can update objects" 
ON storage.objects FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Delete Policy (DELETE) - Uses USING
CREATE POLICY "Authenticated users can delete objects" 
ON storage.objects FOR DELETE 
USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_user_marketplaces_user_id ON user_marketplaces(user_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);