-- Link funders to app_users
ALTER TABLE funders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_funders_user_id ON funders(user_id);
