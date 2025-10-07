/*
  # Add Admin Access to Users Table

  ## Changes
  This migration adds policies to allow admin users to read all user data.
  We use a separate policy specifically for admin access.

  ## Security
  - Regular users can read their own data
  - Admin users (identified by role in their own profile) can read all users
  - This is done safely by using a function that checks the role
*/

-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for admins to read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());
