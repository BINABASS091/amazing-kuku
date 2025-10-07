/*
  # Fix Users Table RLS Policies

  ## Changes
  This migration fixes the infinite recursion issue in the users table RLS policies
  by removing the circular reference where policies check the users table while
  protecting the users table.

  ## Security
  - Users can read their own profile data
  - Users can update their own profile data
  - New users can be created during signup (authenticated users can insert)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Create new policies without circular references
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
