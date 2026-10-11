-- Preserve invited roles, but derive identity from Auth instead of client input.
CREATE OR REPLACE FUNCTION public.apply_invited_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE inv record; trusted_email text;
BEGIN
  SELECT u.email INTO trusted_email FROM auth.users u WHERE u.id = NEW.id;
  IF trusted_email IS NULL THEN RAISE EXCEPTION 'Profile requires an Auth identity' USING ERRCODE = '42501'; END IF;
  NEW.email := trusted_email;
  NEW.role := 'viewer';
  NEW.can_manage_users := false;
  NEW.can_manage_finance := false;
  NEW.allowed_marketplace_ids := '{}'::uuid[];
  SELECT role, status INTO inv FROM public.user_accounts WHERE lower(email) = lower(trusted_email) LIMIT 1;
  IF FOUND THEN
    NEW.role := coalesce(inv.role, 'viewer');
    NEW.active := coalesce(NEW.active, true) AND (inv.status IS NULL OR inv.status = 'active');
    UPDATE public.user_accounts SET auth_id = NEW.id, updated_at = now() WHERE lower(email) = lower(trusted_email);
  END IF;
  IF lower(trusted_email) = 'ahmedrwash@gmail.com' THEN NEW.role := 'admin'; NEW.active := true; END IF;
  RETURN NEW;
END;
$$;
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.guard_profile_authorization()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'Profile identity cannot change' USING ERRCODE = '42501'; END IF;
  SELECT u.email INTO NEW.email FROM auth.users u WHERE u.id = OLD.id;
  IF NEW.email IS NULL THEN RAISE EXCEPTION 'Profile requires an Auth identity' USING ERRCODE = '42501'; END IF;
  IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_admin() AND
    (NEW.role IS DISTINCT FROM OLD.role OR NEW.active IS DISTINCT FROM OLD.active
     OR NEW.can_manage_users IS DISTINCT FROM OLD.can_manage_users
     OR NEW.can_manage_finance IS DISTINCT FROM OLD.can_manage_finance
     OR NEW.allowed_marketplace_ids IS DISTINCT FROM OLD.allowed_marketplace_ids
     OR NEW.ops_hub IS DISTINCT FROM OLD.ops_hub) THEN
    RAISE EXCEPTION 'Only an administrator can change authorization fields' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_profile_authorization() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER trg_guard_profile_authorization
BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.guard_profile_authorization();

