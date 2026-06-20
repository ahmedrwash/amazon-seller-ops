
-- Task 5: Link products table with user_accounts

-- Add user_id column to products if it doesn't exist (assuming it uses created_by primarily, but requirements ask for user_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id') THEN
        ALTER TABLE products ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Update existing user_id based on created_by if needed
UPDATE products SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Create index on products.user_id for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
