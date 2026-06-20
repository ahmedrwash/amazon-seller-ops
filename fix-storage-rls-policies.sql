-- This file contains the SQL commands to fix storage RLS policies.
-- MODIFIED: Removed direct storage.objects manipulation due to permission errors.
-- Please apply policies manually in Supabase Dashboard.

-- 1. Ensure Bucket Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('inbound-email', 'inbound-email', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Documentation Function
-- This function documents the policies that need to be applied manually via the dashboard
CREATE OR REPLACE FUNCTION public.storage_policy_requirements()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN '
  MANUAL ACTION REQUIRED:
  The following RLS policies must be created in the Supabase Dashboard > Storage > Policies for the "inbound-email" bucket:

  1. Policy Name: "Admin All Access"
     - Allowed Operations: ALL
     - Target Roles: authenticated
     - USING expression: 
       EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''Admin'')

  2. Policy Name: "Ops Finance RW Inbound Email"
     - Allowed Operations: ALL
     - Target Roles: authenticated
     - USING expression:
       bucket_id = ''inbound-email'' AND 
       EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''Ops'', ''Finance''))

  3. Policy Name: "Authenticated Read Inbound Email"
     - Allowed Operations: SELECT
     - Target Roles: authenticated
     - USING expression:
       bucket_id = ''inbound-email''
  ';
END;
$$;