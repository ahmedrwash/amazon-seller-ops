
-- Function to auto-create user_accounts on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_accounts (auth_id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'editor',
    'active'
  )
  ON CONFLICT (auth_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire after auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;

CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_account();

-- Backfill existing users (just in case they don't exist in user_accounts yet)
INSERT INTO public.user_accounts (auth_id, email, full_name, role, status)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'editor', 
    'active'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_accounts WHERE auth_id = auth.users.id
)
ON CONFLICT (auth_id) DO NOTHING;
