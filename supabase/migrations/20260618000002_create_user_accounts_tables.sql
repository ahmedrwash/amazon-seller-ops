
-- Create user_accounts table
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'editor',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create user_role_history table
CREATE TABLE IF NOT EXISTS public.user_role_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
    old_role TEXT,
    new_role TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_history ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_id ON public.user_accounts(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON public.user_accounts(role);
CREATE INDEX IF NOT EXISTS idx_user_accounts_status ON public.user_accounts(status);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON public.user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_role_history_user_id ON public.user_role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_changed_at ON public.user_role_history(changed_at DESC);

-- Admin Check Function
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for user_accounts
CREATE POLICY "Users can view own account" 
    ON public.user_accounts FOR SELECT 
    USING (auth.uid() = auth_id);

CREATE POLICY "Admins can view all accounts" 
    ON public.user_accounts FOR SELECT 
    USING (public.is_app_admin());

CREATE POLICY "Admins can update all accounts" 
    ON public.user_accounts FOR UPDATE 
    USING (public.is_app_admin());

-- Policies for user_role_history
CREATE POLICY "Users can view own history" 
    ON public.user_role_history FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.user_accounts 
        WHERE id = user_role_history.user_id AND auth_id = auth.uid()
    ));

CREATE POLICY "Admins can view all history" 
    ON public.user_role_history FOR SELECT 
    USING (public.is_app_admin());

CREATE POLICY "Admins can insert history" 
    ON public.user_role_history FOR INSERT 
    WITH CHECK (public.is_app_admin());
