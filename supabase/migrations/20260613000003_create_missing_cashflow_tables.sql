-- Task 1: Create missing cashflow tables with RLS and indexes

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cashflow_master_product_id ON cashflow_master_data(product_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_history_product_id ON cashflow_master_history(product_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_history_changed_at ON cashflow_master_history(changed_at DESC);

-- Enable RLS
ALTER TABLE cashflow_master_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_master_history ENABLE ROW LEVEL SECURITY;

-- Policies for cashflow_master_data
DROP POLICY IF EXISTS "Users manage own cashflow_master_data" ON cashflow_master_data;
CREATE POLICY "Users manage own cashflow_master_data" ON cashflow_master_data
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = cashflow_master_data.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );

-- Policies for cashflow_master_history
DROP POLICY IF EXISTS "Users manage own cashflow_master_history" ON cashflow_master_history;
CREATE POLICY "Users manage own cashflow_master_history" ON cashflow_master_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = cashflow_master_history.product_id AND (p.created_by = auth.uid() OR p.owner_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'Admin')
    );