-- Task 2: Cashflow Master Data and History
CREATE TABLE IF NOT EXISTS cashflow_master_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    starting_cash NUMERIC DEFAULT 0,
    launch_month_gmv NUMERIC DEFAULT 0,
    monthly_gmv_growth_rate NUMERIC DEFAULT 0,
    amazon_payout_delay_days INTEGER DEFAULT 0,
    variable_cost_percent_gmv NUMERIC DEFAULT 0,
    monthly_ppc_budget NUMERIC DEFAULT 0,
    reorder_cost NUMERIC DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id)
);

CREATE TABLE IF NOT EXISTS cashflow_master_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    change_reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop cashflow fields from product_weekly_data
ALTER TABLE product_weekly_data 
DROP COLUMN IF EXISTS starting_cash,
DROP COLUMN IF EXISTS launch_month_gmv,
DROP COLUMN IF EXISTS monthly_gmv_growth_rate,
DROP COLUMN IF EXISTS amazon_payout_delay_days,
DROP COLUMN IF EXISTS variable_cost_percent_gmv,
DROP COLUMN IF EXISTS monthly_ppc_budget,
DROP COLUMN IF EXISTS reorder_cost;

-- RLS for Cashflow tables
ALTER TABLE cashflow_master_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_master_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cashflow_master_data" ON cashflow_master_data
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = cashflow_master_data.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

CREATE POLICY "Users manage own cashflow_master_history" ON cashflow_master_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = cashflow_master_history.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );


-- Task 4: Task Management System
CREATE TABLE IF NOT EXISTS task_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    project_description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks_ops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES task_projects(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    task_description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    owner_id UUID REFERENCES auth.users(id),
    owner_name TEXT,
    due_date DATE,
    start_date DATE,
    completion_date DATE,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    tags TEXT[],
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_ops_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks_ops(id) ON DELETE CASCADE,
    changed_fields TEXT[],
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_ops_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks_ops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Task tables
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_ops_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_ops_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own task_projects" ON task_projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = task_projects.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

CREATE POLICY "Users manage own tasks_ops" ON tasks_ops
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = tasks_ops.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

CREATE POLICY "Users manage own task_ops_history" ON task_ops_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks_ops t JOIN products p ON t.product_id = p.id WHERE t.id = task_ops_history.task_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

CREATE POLICY "Users manage own task_ops_comments" ON task_ops_comments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks_ops t JOIN products p ON t.product_id = p.id WHERE t.id = task_ops_comments.task_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );