-- First, check if the user exists in auth.users
SELECT * FROM auth.users WHERE email = 'admin@fugajipro.com';

-- If the user exists, update their role to ADMIN in the users table
UPDATE users 
SET role = 'ADMIN',
    updated_at = NOW()
WHERE email = 'admin@fugajipro.com'
RETURNING *;

-- If the user doesn't exist in the users table but exists in auth.users, insert them
-- First get the user ID from auth.users
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@fugajipro.com' LIMIT 1
)
INSERT INTO users (id, email, full_name, role, phone, avatar_url, created_at, updated_at)
SELECT 
  id, 
  'admin@fugajipro.com',
  'Admin User',
  'ADMIN',
  NULL,
  NULL,
  NOW(),
  NOW()
FROM auth_user
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@fugajipro.com'
)
RETURNING *;
