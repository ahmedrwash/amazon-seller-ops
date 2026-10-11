-- Rollback-only checks against an existing viewer. No persistent test accounts.
begin;
do $$
declare viewer_id uuid; original_email text;
begin
  select id, email into viewer_id, original_email from public.profiles where role='viewer' limit 1;
  if viewer_id is null then raise exception 'Fixture required: one existing viewer'; end if;
  perform set_config('request.jwt.claim.sub', viewer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub',viewer_id,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    update public.profiles set can_manage_users=true where id=viewer_id;
    raise exception 'FAIL: authorization escalation accepted';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set email='ahmedrwash@gmail.com' where id=viewer_id;
  if exists (select 1 from public.profiles where id=viewer_id and email is distinct from original_email) then
    raise exception 'FAIL: identity spoof accepted';
  end if;
  if public.is_admin() then raise exception 'FAIL: viewer became admin'; end if;
end $$;
rollback;
