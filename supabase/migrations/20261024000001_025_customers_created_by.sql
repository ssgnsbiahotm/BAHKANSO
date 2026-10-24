ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
