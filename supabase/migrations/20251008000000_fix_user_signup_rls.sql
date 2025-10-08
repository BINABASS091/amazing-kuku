/*
  # Fix User Signup RLS Policy

  ## Problem
  The current INSERT policy requires auth.uid() = id, but during signup
  the user row doesn't exist yet, causing RLS violations.

  ## Solution
  Allow authenticated users to insert a row with their own auth.uid()
  without checking if they already exist in the table.

  ## Security
  - Users can only insert their own profile (auth.uid() = id)
  - No security risk since users can only create one profile per auth.uid()
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new policy that allows signup
CREATE POLICY "Allow signup profile creation"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Also ensure we have the correct default for the id column
ALTER TABLE users ALTER COLUMN id SET DEFAULT auth.uid();
