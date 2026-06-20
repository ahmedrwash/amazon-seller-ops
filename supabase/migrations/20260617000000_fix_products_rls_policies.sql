
-- Task 1: Fix RLS policies for products table

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Creators can update own products" ON products;
DROP POLICY IF EXISTS "Marketplace scoped read products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Creators can delete own products" ON products;
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- Create new comprehensive RLS policies
CREATE POLICY "Users can select own products" 
    ON products FOR SELECT 
    USING (created_by = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can insert own products" 
    ON products FOR INSERT 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own products" 
    ON products FOR UPDATE 
    USING (created_by = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can delete own products" 
    ON products FOR DELETE 
    USING (created_by = auth.uid() OR owner_id = auth.uid());
