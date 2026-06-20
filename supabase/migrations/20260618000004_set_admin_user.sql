
-- Function to set a user as admin by email
CREATE OR REPLACE FUNCTION public.set_admin_by_email(admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = admin_email;
  
  IF target_user_id IS NOT NULL THEN
    -- Upsert the user into user_accounts with admin role
    INSERT INTO public.user_accounts (auth_id, email, full_name, role, status)
    VALUES (
      target_user_id, 
      admin_email, 
      (SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(admin_email, '@', 1)) FROM auth.users WHERE id = target_user_id), 
      'admin', 
      'active'
    )
    ON CONFLICT (auth_id) 
    DO UPDATE SET 
      role = 'admin', 
      status = 'active',
      updated_at = timezone('utc', now());
      
    RAISE NOTICE 'User % has been set to admin.', admin_email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users. They must sign up first.', admin_email;
  END IF;
END;
$$;

-- Execute the function for ahmedrwash@hotmail.com
SELECT public.set_admin_by_email('ahmedrwash@hotmail.com');
