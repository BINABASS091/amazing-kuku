/*
  # Update Devices Table for Smart Kuku

  ## Changes
  Updates the existing devices table to include more comprehensive device management fields
  suitable for IoT poultry farm monitoring.

  ## Modifications
  - Add device_name column for friendly naming
  - Rename device_code to serial_number for clarity
  - Add batch_id reference for batch-specific devices
  - Expand device_type options to include more sensor types
  - Rename status values to match common IoT terminology
  - Add last_online timestamp
  - Add firmware_version field
  - Add installation_date field
  - Add notes field for additional information

  ## Security
  - Maintains existing RLS policies
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add device_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'device_name'
  ) THEN
    ALTER TABLE devices ADD COLUMN device_name text NOT NULL DEFAULT 'Unnamed Device';
  END IF;

  -- Add batch_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE devices ADD COLUMN batch_id uuid REFERENCES batches(id) ON DELETE SET NULL;
  END IF;

  -- Add last_online column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'last_online'
  ) THEN
    ALTER TABLE devices ADD COLUMN last_online timestamptz DEFAULT now();
  END IF;

  -- Add firmware_version column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'firmware_version'
  ) THEN
    ALTER TABLE devices ADD COLUMN firmware_version text;
  END IF;

  -- Add installation_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'installation_date'
  ) THEN
    ALTER TABLE devices ADD COLUMN installation_date date DEFAULT CURRENT_DATE;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'notes'
  ) THEN
    ALTER TABLE devices ADD COLUMN notes text;
  END IF;

  -- Rename device_code to serial_number if device_code exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'device_code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'serial_number'
  ) THEN
    ALTER TABLE devices RENAME COLUMN device_code TO serial_number;
  END IF;
END $$;

-- Drop existing device_type constraint if it exists
DO $$
BEGIN
  ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new device_type constraint with expanded options
ALTER TABLE devices ADD CONSTRAINT devices_device_type_check
  CHECK (device_type IN ('TEMPERATURE_SENSOR', 'HUMIDITY_SENSOR', 'FEEDER', 'WATERER', 'CAMERA', 'CONTROLLER', 'AIR_QUALITY', 'WEIGHT_SCALE', 'SENSOR', 'WATER', 'OTHER'));

-- Drop existing status constraint if it exists
DO $$
BEGIN
  ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new status constraint with updated values
ALTER TABLE devices ADD CONSTRAINT devices_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY', 'ONLINE', 'OFFLINE', 'ERROR'));

-- Create index for batch_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_devices_batch_id ON devices(batch_id);

-- Create index for status if it doesn't exist  
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
