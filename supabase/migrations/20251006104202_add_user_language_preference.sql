/*
  # Add Language Preference to Users

  1. Changes
    - Add `preferred_language` column to users table
    - Default to 'en' (English)
    - Supports 'en' and 'sw' (Kiswahili)

  2. Notes
    - This allows users to persist their language preference
    - Language preference is automatically loaded when user logs in
*/

-- Add preferred_language column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_language text DEFAULT 'en';
  END IF;
END $$;

-- Add check constraint for valid language codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'users_preferred_language_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_preferred_language_check
      CHECK (preferred_language IN ('en', 'sw'));
  END IF;
END $$;
