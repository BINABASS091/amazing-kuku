/*
  # Add Farmer Verification Status

  1. Changes
    - Add `is_verified` column to farmers table (default false)
    - Add `verified_at` column to track when verification happened
    - Add `verified_by` column to track which admin verified the farmer
    - Add index for faster queries on verification status

  2. Notes
    - New farmers will be unverified by default
    - Admins can verify farmers to grant them access
    - Farmers cannot access the system until verified
*/

-- Add verification columns to farmers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farmers' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE farmers ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farmers' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE farmers ADD COLUMN verified_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farmers' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE farmers ADD COLUMN verified_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Create index for faster verification status queries
CREATE INDEX IF NOT EXISTS idx_farmers_is_verified ON farmers(is_verified);

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can verify farmers" ON farmers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can verify farmers"
  ON farmers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );
