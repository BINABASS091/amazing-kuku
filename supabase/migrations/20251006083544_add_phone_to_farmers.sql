/*
  # Add phone number to farmers table

  1. Changes
    - Add `phone_number` column to `farmers` table
    - Column is text type, nullable to support existing records
    - Will store farmer's phone number for business communication and verification

  2. Notes
    - Existing farmers will have NULL phone numbers initially
    - Can be updated through profile page
    - New farmers will provide phone during registration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farmers' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE farmers ADD COLUMN phone_number text;
  END IF;
END $$;
