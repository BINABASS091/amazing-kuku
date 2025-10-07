/*
  # Fix Farmers Table INSERT Policy

  ## Changes
  Adds an INSERT policy to allow new users to create their farmer record during signup.
  
  ## Security
  - Authenticated users can insert their own farmer record (user_id = auth.uid())
  - Users cannot create farmer records for other users
  - This is essential for the signup flow to complete successfully
*/

CREATE POLICY "Farmers can insert own record"
  ON farmers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
