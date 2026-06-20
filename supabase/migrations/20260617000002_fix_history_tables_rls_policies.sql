
-- Task 3: Fix RLS policies for all history tables

-- 1. profit_margin_history
ALTER TABLE profit_margin_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON profit_margin_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON profit_margin_history;

CREATE POLICY "Users can select own profit margin history" ON profit_margin_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own profit margin history" ON profit_margin_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 2. ppc_acos_history
ALTER TABLE ppc_acos_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON ppc_acos_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON ppc_acos_history;

CREATE POLICY "Users can select own ppc acos history" ON ppc_acos_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own ppc acos history" ON ppc_acos_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 3. inventory_history
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON inventory_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON inventory_history;

CREATE POLICY "Users can select own inventory history" ON inventory_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own inventory history" ON inventory_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 4. fba_fees_history
ALTER TABLE fba_fees_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON fba_fees_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON fba_fees_history;

CREATE POLICY "Users can select own fba fees history" ON fba_fees_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own fba fees history" ON fba_fees_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 5. breakeven_history
ALTER TABLE breakeven_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON breakeven_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON breakeven_history;

CREATE POLICY "Users can select own breakeven history" ON breakeven_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own breakeven history" ON breakeven_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 6. cashflow_history
ALTER TABLE cashflow_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON cashflow_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON cashflow_history;

CREATE POLICY "Users can select own cashflow history" ON cashflow_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own cashflow history" ON cashflow_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 7. tariff_cogs_history
ALTER TABLE tariff_cogs_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON tariff_cogs_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON tariff_cogs_history;

CREATE POLICY "Users can select own tariff cogs history" ON tariff_cogs_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own tariff cogs history" ON tariff_cogs_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));

-- 8. kpis_history
ALTER TABLE kpis_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own product history" ON kpis_history;
DROP POLICY IF EXISTS "Users can insert own product history" ON kpis_history;

CREATE POLICY "Users can select own kpis history" ON kpis_history FOR SELECT 
    USING (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
CREATE POLICY "Users can insert own kpis history" ON kpis_history FOR INSERT 
    WITH CHECK (product_id IN (SELECT id FROM products WHERE created_by = auth.uid() OR owner_id = auth.uid()));
