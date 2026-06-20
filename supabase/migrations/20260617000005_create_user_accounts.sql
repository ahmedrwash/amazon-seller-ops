
-- Task 2: Create user accounts and history tables migration

CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role_id UUID REFERENCES user_roles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS user_account_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    old_role_id UUID REFERENCES user_roles(id),
    new_role_id UUID REFERENCES user_roles(id),
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts ua
    JOIN user_roles ur ON ua.role_id = ur.id
    WHERE ua.id = auth.uid() AND ur.role_name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for user_accounts
CREATE POLICY "Users can view own account" ON user_accounts 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all accounts" ON user_accounts 
    FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all accounts" ON user_accounts 
    FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can insert all accounts" ON user_accounts 
    FOR INSERT WITH CHECK (public.is_admin_user() OR auth.uid() = id); -- Allow self-insert for trigger

-- Policies for user_account_history
CREATE POLICY "Users can view own history" ON user_account_history 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all history" ON user_account_history 
    FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can insert history" ON user_account_history 
    FOR INSERT WITH CHECK (public.is_admin_user());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_role_id_v2 ON user_accounts(role_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_status_v2 ON user_accounts(status);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_account_history_user_id_v2 ON user_account_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_account_history_changed_at_desc ON user_account_history(changed_at DESC);
