/*
  # Fix User Profile Creation During Signup

  ## Changes
  Updates the users table INSERT policy to allow authenticated users to create
  their own profile record during signup. This is essential for the signup flow
  to work correctly.

  ## Security
  - Users can only insert their own profile (auth.uid() = id)
  - The policy ensures users cannot create profiles for other users
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;

-- Create a new policy that allows users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
