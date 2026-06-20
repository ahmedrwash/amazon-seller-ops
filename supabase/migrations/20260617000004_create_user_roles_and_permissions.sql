
-- Task 1: Create user roles and permissions tables migration

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(role_id, permission_name)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies allowing anyone to view
CREATE POLICY "Anyone can read user roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Anyone can read user permissions" ON user_permissions FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role_id ON user_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_name ON user_permissions(permission_name);

-- Insert default roles (ON CONFLICT DO NOTHING to be safe)
INSERT INTO user_roles (role_name, description) VALUES
    ('admin', 'Full access to all system features'),
    ('editor', 'Can create and edit most operational data'),
    ('collaborator', 'Can edit specific operational data but not create products'),
    ('viewer', 'Read-only access to products and data')
ON CONFLICT (role_name) DO NOTHING;

-- Insert permissions for roles
DO $$
DECLARE
    admin_id UUID;
    editor_id UUID;
    collab_id UUID;
    viewer_id UUID;
BEGIN
    SELECT id INTO admin_id FROM user_roles WHERE role_name = 'admin';
    SELECT id INTO editor_id FROM user_roles WHERE role_name = 'editor';
    SELECT id INTO collab_id FROM user_roles WHERE role_name = 'collaborator';
    SELECT id INTO viewer_id FROM user_roles WHERE role_name = 'viewer';

    -- Admin gets full access
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (admin_id, 'manage_users', 'Manage user accounts and roles'),
        (admin_id, 'create_products', 'Create new products'),
        (admin_id, 'edit_products', 'Edit product details'),
        (admin_id, 'delete_products', 'Delete products'),
        (admin_id, 'view_products', 'View all products'),
        (admin_id, 'edit_weekly_data', 'Edit weekly operational data'),
        (admin_id, 'create_tasks', 'Create tasks'),
        (admin_id, 'manage_settings', 'Manage system settings')
    ON CONFLICT DO NOTHING;

    -- Editor gets most access, no user/setting management
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (editor_id, 'create_products', 'Create new products'),
        (editor_id, 'edit_products', 'Edit product details'),
        (editor_id, 'view_products', 'View all products'),
        (editor_id, 'edit_weekly_data', 'Edit weekly operational data'),
        (editor_id, 'create_tasks', 'Create tasks')
    ON CONFLICT DO NOTHING;

    -- Collaborator gets edit access but cannot create products
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (collab_id, 'view_products', 'View all products'),
        (collab_id, 'edit_products', 'Edit product details'),
        (collab_id, 'edit_weekly_data', 'Edit weekly operational data'),
        (collab_id, 'create_tasks', 'Create tasks')
    ON CONFLICT DO NOTHING;

    -- Viewer gets read-only
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (viewer_id, 'view_products', 'View all products')
    ON CONFLICT DO NOTHING;
END $$;
