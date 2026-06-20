-- Task 2: Create task management tables with RLS and indexes

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

CREATE TABLE IF NOT EXISTS tasks (
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

CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    changed_fields TEXT[],
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_projects_product_id ON task_projects(product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_product_id ON tasks(product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- Enable RLS
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users manage own task_projects" ON task_projects;
CREATE POLICY "Users manage own task_projects" ON task_projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = task_projects.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

DROP POLICY IF EXISTS "Users manage own tasks" ON tasks;
CREATE POLICY "Users manage own tasks" ON tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = tasks.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

DROP POLICY IF EXISTS "Users manage own task_history" ON task_history;
CREATE POLICY "Users manage own task_history" ON task_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks t JOIN products p ON t.product_id = p.id WHERE t.id = task_history.task_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

DROP POLICY IF EXISTS "Users manage own task_comments" ON task_comments;
CREATE POLICY "Users manage own task_comments" ON task_comments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks t JOIN products p ON t.product_id = p.id WHERE t.id = task_comments.task_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );