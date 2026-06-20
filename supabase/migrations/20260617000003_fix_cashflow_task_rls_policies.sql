
-- Task 4: Fix RLS policies for cashflow and task-related tables

-- 1. cashflow_master_data
ALTER TABLE cashflow_master_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own cashflow_master_data" ON cashflow_master_data;

CREATE POLICY "Users select own cashflow master" ON cashflow_master_data FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users insert own cashflow master" ON cashflow_master_data FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users update own cashflow master" ON cashflow_master_data FOR UPDATE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users delete own cashflow master" ON cashflow_master_data FOR DELETE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 2. task_projects
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own task_projects" ON task_projects;

CREATE POLICY "Users select own task projects" ON task_projects FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users insert own task projects" ON task_projects FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users update own task projects" ON task_projects FOR UPDATE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users delete own task projects" ON task_projects FOR DELETE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 3. tasks (task_ops/tasks depending on naming schema - assuming tasks based on prompt)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own tasks" ON tasks;

CREATE POLICY "Users select own tasks" ON tasks FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users insert own tasks" ON tasks FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users update own tasks" ON tasks FOR UPDATE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users delete own tasks" ON tasks FOR DELETE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 4. task_history
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own task_history" ON task_history;

CREATE POLICY "Users select own task history" ON task_history FOR SELECT 
    USING (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
CREATE POLICY "Users insert own task history" ON task_history FOR INSERT 
    WITH CHECK (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
CREATE POLICY "Users update own task history" ON task_history FOR UPDATE 
    USING (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
CREATE POLICY "Users delete own task history" ON task_history FOR DELETE 
    USING (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));

-- 5. task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own task_comments" ON task_comments;

CREATE POLICY "Users select own task comments" ON task_comments FOR SELECT 
    USING (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
CREATE POLICY "Users insert own task comments" ON task_comments FOR INSERT 
    WITH CHECK (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
CREATE POLICY "Users update own task comments" ON task_comments FOR UPDATE 
    USING (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
CREATE POLICY "Users delete own task comments" ON task_comments FOR DELETE 
    USING (task_id IN (SELECT id FROM tasks WHERE product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid())));
