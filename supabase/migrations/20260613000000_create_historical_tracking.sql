-- Task 1: Create Historical Tracking Tables
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['profit_margin_history', 'ppc_acos_history', 'inventory_history', 'fba_fees_history', 'breakeven_history', 'cashflow_history', 'tariff_cogs_history', 'kpis_history', 'milestones_history']) LOOP
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID REFERENCES products(id),
                week_number INTEGER,
                old_values JSONB,
                new_values JSONB,
                changed_fields TEXT[],
                change_reason TEXT,
                changed_by UUID REFERENCES auth.users(id),
                changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE (product_id, week_number, changed_at)
            );
        ', t_name);
        
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t_name);
        
        EXECUTE format('
            CREATE POLICY "Users can view own product history" ON %I 
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM products p 
                    WHERE p.id = %I.product_id 
                    AND (p.created_by = auth.uid() OR p.owner_id = auth.uid())
                ) OR EXISTS (
                    SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = ''Admin''
                )
            );
        ', t_name, t_name);

        EXECUTE format('
            CREATE POLICY "Users can insert own product history" ON %I 
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM products p 
                    WHERE p.id = %I.product_id 
                    AND (p.created_by = auth.uid() OR p.owner_id = auth.uid())
                ) OR EXISTS (
                    SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = ''Admin''
                )
            );
        ', t_name, t_name);
    END LOOP;
END $$;