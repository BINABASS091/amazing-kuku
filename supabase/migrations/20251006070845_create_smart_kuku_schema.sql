/*
  # Smart Kuku Database Schema

  ## Overview
  This migration creates the complete database schema for the Smart Kuku poultry management system,
  supporting both Admin and Farmer user roles with comprehensive farm, batch, device, and activity tracking.

  ## New Tables

  ### Core User Tables
  1. `users` - Extended user profile information
     - `id` (uuid, references auth.users)
     - `email` (text)
     - `full_name` (text)
     - `phone` (text)
     - `role` (text) - 'ADMIN' or 'FARMER'
     - `avatar_url` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `farmers` - Farmer-specific information
     - `id` (uuid, primary key)
     - `user_id` (uuid, references users)
     - `business_name` (text)
     - `location` (text)
     - `verification_status` (text) - 'PENDING', 'VERIFIED', 'REJECTED'
     - `experience_years` (int)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ### Farm Management Tables
  3. `farms` - Farm registration and details
     - `id` (uuid, primary key)
     - `farmer_id` (uuid, references farmers)
     - `name` (text)
     - `location` (text)
     - `size_hectares` (decimal)
     - `latitude` (decimal)
     - `longitude` (decimal)
     - `status` (text) - 'ACTIVE', 'INACTIVE', 'MAINTENANCE'
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  4. `batches` - Poultry batch tracking
     - `id` (uuid, primary key)
     - `farm_id` (uuid, references farms)
     - `batch_number` (text)
     - `breed` (text)
     - `quantity` (int)
     - `start_date` (date)
     - `expected_end_date` (date)
     - `status` (text) - 'ACTIVE', 'COMPLETED', 'CLOSED'
     - `mortality_count` (int)
     - `current_age_days` (int)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. `devices` - IoT device management
     - `id` (uuid, primary key)
     - `farm_id` (uuid, references farms)
     - `device_code` (text)
     - `device_type` (text) - 'SENSOR', 'FEEDER', 'WATER', 'CAMERA'
     - `status` (text) - 'ONLINE', 'OFFLINE', 'ERROR'
     - `last_reading_at` (timestamptz)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  6. `sensor_readings` - Device sensor data
     - `id` (uuid, primary key)
     - `device_id` (uuid, references devices)
     - `temperature` (decimal)
     - `humidity` (decimal)
     - `ammonia_level` (decimal)
     - `reading_time` (timestamptz)
     - `created_at` (timestamptz)

  ### Activity & Task Management
  7. `activities` - Daily farm activities
     - `id` (uuid, primary key)
     - `batch_id` (uuid, references batches)
     - `farmer_id` (uuid, references farmers)
     - `activity_type` (text) - 'FEEDING', 'VACCINATION', 'CLEANING', 'INSPECTION'
     - `description` (text)
     - `status` (text) - 'PENDING', 'COMPLETED', 'CANCELLED'
     - `scheduled_date` (date)
     - `completed_at` (timestamptz)
     - `created_at` (timestamptz)

  ### Subscription Management
  8. `subscriptions` - Farmer subscription tracking
     - `id` (uuid, primary key)
     - `farmer_id` (uuid, references farmers)
     - `plan_type` (text) - 'FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'
     - `status` (text) - 'ACTIVE', 'EXPIRED', 'CANCELLED'
     - `start_date` (date)
     - `end_date` (date)
     - `amount` (decimal)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ### Knowledge Base
  9. `recommendations` - Best practice recommendations
     - `id` (uuid, primary key)
     - `title` (text)
     - `category` (text) - 'FEEDING', 'HEALTH', 'ENVIRONMENT', 'BIOSECURITY'
     - `content` (text)
     - `breed` (text)
     - `age_range_days` (text)
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)

  10. `medications` - Medication and vaccination records
      - `id` (uuid, primary key)
      - `batch_id` (uuid, references batches)
      - `medication_name` (text)
      - `dosage` (text)
      - `purpose` (text)
      - `administered_by` (uuid, references farmers)
      - `administered_at` (timestamptz)
      - `created_at` (timestamptz)

  11. `alerts` - System alerts and notifications
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, references farmers)
      - `alert_type` (text) - 'HEALTH', 'ENVIRONMENT', 'DEVICE', 'SYSTEM'
      - `severity` (text) - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      - `message` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Admins can access all data
  - Farmers can only access their own data
  - Public read access for recommendations (authenticated users)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'FARMER' CHECK (role IN ('ADMIN', 'FARMER')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  business_name text,
  location text,
  verification_status text DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  experience_years int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own data"
  ON farmers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can update own data"
  ON farmers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage farmers"
  ON farmers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  size_hectares decimal(10, 2),
  latitude decimal(10, 6),
  longitude decimal(10, 6),
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own farms"
  ON farms FOR SELECT
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can manage own farms"
  ON farms FOR ALL
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ))
  WITH CHECK (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all farms"
  ON farms FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  batch_number text NOT NULL,
  breed text NOT NULL,
  quantity int NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  expected_end_date date,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CLOSED')),
  mortality_count int DEFAULT 0,
  current_age_days int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own batches"
  ON batches FOR SELECT
  TO authenticated
  USING (farm_id IN (
    SELECT f.id FROM farms f
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can manage own batches"
  ON batches FOR ALL
  TO authenticated
  USING (farm_id IN (
    SELECT f.id FROM farms f
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT f.id FROM farms f
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all batches"
  ON batches FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  device_code text UNIQUE NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('SENSOR', 'FEEDER', 'WATER', 'CAMERA')),
  status text DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR')),
  last_reading_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (farm_id IN (
    SELECT f.id FROM farms f
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can manage own devices"
  ON devices FOR ALL
  TO authenticated
  USING (farm_id IN (
    SELECT f.id FROM farms f
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT f.id FROM farms f
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all devices"
  ON devices FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  temperature decimal(5, 2),
  humidity decimal(5, 2),
  ammonia_level decimal(5, 2),
  reading_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own sensor data"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (device_id IN (
    SELECT d.id FROM devices d
    JOIN farms f ON d.farm_id = f.id
    JOIN farmers fa ON f.farmer_id = fa.id
    WHERE fa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "System can insert sensor readings"
  ON sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('FEEDING', 'VACCINATION', 'CLEANING', 'INSPECTION', 'OTHER')),
  description text,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own activities"
  ON activities FOR SELECT
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can manage own activities"
  ON activities FOR ALL
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ))
  WITH CHECK (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all activities"
  ON activities FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
  start_date date NOT NULL,
  end_date date,
  amount decimal(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('FEEDING', 'HEALTH', 'ENVIRONMENT', 'BIOSECURITY')),
  content text NOT NULL,
  breed text,
  age_range_days text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage recommendations"
  ON recommendations FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  purpose text,
  administered_by uuid REFERENCES farmers(id) NOT NULL,
  administered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (administered_by IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can manage own medications"
  ON medications FOR ALL
  TO authenticated
  USING (administered_by IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ))
  WITH CHECK (administered_by IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all medications"
  ON medications FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('HEALTH', 'ENVIRONMENT', 'DEVICE', 'SYSTEM')),
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can read own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ) OR farmer_id IS NULL OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ))
  WITH CHECK (farmer_id IN (
    SELECT id FROM farmers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all alerts"
  ON alerts FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ))
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_batches_farm_id ON batches(farm_id);
CREATE INDEX IF NOT EXISTS idx_devices_farm_id ON devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_activities_batch_id ON activities(batch_id);
CREATE INDEX IF NOT EXISTS idx_activities_farmer_id ON activities(farmer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_farmer_id ON subscriptions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_medications_batch_id ON medications(batch_id);
CREATE INDEX IF NOT EXISTS idx_alerts_farmer_id ON alerts(farmer_id);
