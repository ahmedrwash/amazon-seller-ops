
-- Task 1: Create user roles and permissions database schema

-- 1. Create user_roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Insert default roles
INSERT INTO user_roles (role_name, description) VALUES
    ('admin', 'Full access to all system features and user management'),
    ('editor', 'Can create and edit products and operational data'),
    ('collaborator', 'Can edit specific operational data and tasks but cannot create products'),
    ('viewer', 'Read-only access to products and operational data');

-- 2. Create user_permissions table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(role_id, permission_name)
);

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

    -- Admin permissions
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (admin_id, 'manage_users', 'Manage user accounts and roles'),
        (admin_id, 'create_products', 'Create new products'),
        (admin_id, 'edit_products', 'Edit product details'),
        (admin_id, 'delete_products', 'Delete products'),
        (admin_id, 'view_products', 'View all products'),
        (admin_id, 'edit_weekly_data', 'Edit weekly operational data'),
        (admin_id, 'create_tasks', 'Create tasks'),
        (admin_id, 'manage_settings', 'Manage system settings');

    -- Editor permissions
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (editor_id, 'create_products', 'Create new products'),
        (editor_id, 'edit_products', 'Edit product details'),
        (editor_id, 'view_products', 'View all products'),
        (editor_id, 'edit_weekly_data', 'Edit weekly operational data'),
        (editor_id, 'create_tasks', 'Create tasks');

    -- Collaborator permissions
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (collab_id, 'view_products', 'View all products'),
        (collab_id, 'edit_weekly_data', 'Edit weekly operational data'),
        (collab_id, 'create_tasks', 'Create tasks');

    -- Viewer permissions
    INSERT INTO user_permissions (role_id, permission_name, description) VALUES
        (viewer_id, 'view_products', 'View all products');
END $$;

-- 3. Create user_accounts table
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role_id UUID REFERENCES user_roles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. Create user_account_history table
CREATE TABLE user_account_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    old_role_id UUID REFERENCES user_roles(id),
    new_role_id UUID REFERENCES user_roles(id),
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. Enable RLS and create policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account_history ENABLE ROW LEVEL SECURITY;

-- user_roles policies
CREATE POLICY "Anyone can read user roles" ON user_roles FOR SELECT USING (true);

-- user_permissions policies
CREATE POLICY "Anyone can read user permissions" ON user_permissions FOR SELECT USING (true);

-- user_accounts policies
CREATE POLICY "Users can view own account" ON user_accounts FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all accounts" ON user_accounts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_accounts ua 
        JOIN user_roles ur ON ua.role_id = ur.id 
        WHERE ua.id = auth.uid() AND ur.role_name = 'admin'
    )
);
CREATE POLICY "Admins can update all accounts" ON user_accounts FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_accounts ua 
        JOIN user_roles ur ON ua.role_id = ur.id 
        WHERE ua.id = auth.uid() AND ur.role_name = 'admin'
    )
);

-- user_account_history policies
CREATE POLICY "Users can view own history" ON user_account_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all history" ON user_account_history FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_accounts ua 
        JOIN user_roles ur ON ua.role_id = ur.id 
        WHERE ua.id = auth.uid() AND ur.role_name = 'admin'
    )
);
CREATE POLICY "Admins can insert history" ON user_account_history FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_accounts ua 
        JOIN user_roles ur ON ua.role_id = ur.id 
        WHERE ua.id = auth.uid() AND ur.role_name = 'admin'
    )
);

-- 6. Create Indexes
CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
CREATE INDEX idx_user_accounts_status ON user_accounts(status);
CREATE INDEX idx_user_account_history_user_id ON user_account_history(user_id);
CREATE INDEX idx_user_account_history_changed_at ON user_account_history(changed_at);
