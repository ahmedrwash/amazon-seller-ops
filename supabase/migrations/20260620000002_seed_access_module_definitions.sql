-- The per-user access layer writes user_module_permissions rows whose module_id
-- is a FK to module_definitions(module_id). Register the modules the app uses
-- that were missing from module_definitions so those inserts succeed.
-- Applied to project ehanopftvshlbanmhrxu on 2026-06-20.
insert into public.module_definitions (module_id, module_name, description, icon, order_index, active) values
  ('ops_hub',         'Amazon Ops Hub',  'Weekly performance tracking and analytics', 'bar-chart-3', 0,  true),
  ('email_intake',    'Email Intake',    'Inbound email parsing and review',          'mail',        13, true),
  ('user_management', 'User Management', 'Manage users, roles and access',            'users',       14, true)
on conflict (module_id) do nothing;
