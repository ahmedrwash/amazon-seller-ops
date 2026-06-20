
-- Task 2: Fix RLS policies for product_weekly_data table

ALTER TABLE product_weekly_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update product_weekly_data" ON product_weekly_data;
DROP POLICY IF EXISTS "Users can insert product_weekly_data" ON product_weekly_data;
DROP POLICY IF EXISTS "Users can view product_weekly_data" ON product_weekly_data;

-- Create new comprehensive RLS policies
CREATE POLICY "Users can select own weekly data" 
    ON product_weekly_data FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

CREATE POLICY "Users can insert own weekly data" 
    ON product_weekly_data FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

CREATE POLICY "Users can update own weekly data" 
    ON product_weekly_data FOR UPDATE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

CREATE POLICY "Users can delete own weekly data" 
    ON product_weekly_data FOR DELETE 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
