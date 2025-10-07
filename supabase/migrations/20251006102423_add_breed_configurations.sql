/*
  # Breed Configurations and Farming Guidance System

  1. New Tables
    - `breed_configurations`
      - `id` (uuid, primary key)
      - `breed_name` (text, unique) - Name of the poultry breed
      - `breed_type` (text) - MEAT, EGG, or DUAL_PURPOSE
      - `description` (text) - Detailed description of the breed
      - `average_maturity_days` (integer) - Days to maturity
      - `production_lifespan_days` (integer) - Production period
      - `average_weight_kg` (numeric) - Average market weight
      - `eggs_per_year` (integer) - Egg production (if applicable)
      - `feed_consumption_daily_grams` (numeric) - Daily feed requirements
      - `space_requirement_sqm` (numeric) - Space per bird
      - `temperature_min_celsius` (numeric) - Minimum temperature
      - `temperature_max_celsius` (numeric) - Maximum temperature
      - `humidity_min_percent` (numeric) - Minimum humidity
      - `humidity_max_percent` (numeric) - Maximum humidity
      - `is_active` (boolean) - Whether breed is available
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `breed_stages`
      - `id` (uuid, primary key)
      - `breed_id` (uuid, foreign key to breed_configurations)
      - `stage_name` (text) - Stage name (e.g., Chick, Grower, Layer)
      - `start_day` (integer) - Starting day of stage
      - `end_day` (integer) - Ending day of stage
      - `description` (text) - Stage description
      - `feeding_guide` (text) - Feeding instructions
      - `health_tips` (text) - Health management tips
      - `housing_requirements` (text) - Housing needs
      - `expected_weight_kg` (numeric) - Expected weight at stage
      - `mortality_threshold_percent` (numeric) - Acceptable mortality rate
      - `feed_type` (text) - Recommended feed type
      - `vaccination_schedule` (text) - Vaccination requirements
      - `common_diseases` (text) - Common diseases at this stage
      - `management_practices` (text) - Best practices
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `breed_milestones`
      - `id` (uuid, primary key)
      - `breed_id` (uuid, foreign key to breed_configurations)
      - `stage_id` (uuid, foreign key to breed_stages)
      - `milestone_day` (integer) - Day milestone occurs
      - `milestone_title` (text) - Title of milestone
      - `milestone_description` (text) - Description
      - `action_required` (text) - Required actions
      - `is_critical` (boolean) - Critical milestone flag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admins can manage all breed configurations
    - Farmers can only read breed configurations
    - Public cannot access breed data

  3. Indexes
    - Index on breed_name for fast lookups
    - Index on breed_type for filtering
    - Index on breed_id in related tables
*/

-- Create breed_configurations table
CREATE TABLE IF NOT EXISTS breed_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_name text UNIQUE NOT NULL,
  breed_type text NOT NULL CHECK (breed_type IN ('MEAT', 'EGG', 'DUAL_PURPOSE')),
  description text,
  average_maturity_days integer DEFAULT 0,
  production_lifespan_days integer DEFAULT 0,
  average_weight_kg numeric(5,2) DEFAULT 0,
  eggs_per_year integer DEFAULT 0,
  feed_consumption_daily_grams numeric(8,2) DEFAULT 0,
  space_requirement_sqm numeric(5,2) DEFAULT 0,
  temperature_min_celsius numeric(4,1) DEFAULT 0,
  temperature_max_celsius numeric(4,1) DEFAULT 0,
  humidity_min_percent numeric(4,1) DEFAULT 0,
  humidity_max_percent numeric(4,1) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create breed_stages table
CREATE TABLE IF NOT EXISTS breed_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_id uuid NOT NULL REFERENCES breed_configurations(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  start_day integer NOT NULL DEFAULT 0,
  end_day integer NOT NULL DEFAULT 0,
  description text,
  feeding_guide text,
  health_tips text,
  housing_requirements text,
  expected_weight_kg numeric(5,2) DEFAULT 0,
  mortality_threshold_percent numeric(4,1) DEFAULT 0,
  feed_type text,
  vaccination_schedule text,
  common_diseases text,
  management_practices text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_day_range CHECK (start_day <= end_day)
);

-- Create breed_milestones table
CREATE TABLE IF NOT EXISTS breed_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_id uuid NOT NULL REFERENCES breed_configurations(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES breed_stages(id) ON DELETE SET NULL,
  milestone_day integer NOT NULL,
  milestone_title text NOT NULL,
  milestone_description text,
  action_required text,
  is_critical boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_breed_name ON breed_configurations(breed_name);
CREATE INDEX IF NOT EXISTS idx_breed_type ON breed_configurations(breed_type);
CREATE INDEX IF NOT EXISTS idx_breed_active ON breed_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_breed_stages_breed_id ON breed_stages(breed_id);
CREATE INDEX IF NOT EXISTS idx_breed_stages_order ON breed_stages(breed_id, order_index);
CREATE INDEX IF NOT EXISTS idx_breed_milestones_breed_id ON breed_milestones(breed_id);
CREATE INDEX IF NOT EXISTS idx_breed_milestones_stage_id ON breed_milestones(stage_id);
CREATE INDEX IF NOT EXISTS idx_breed_milestones_day ON breed_milestones(breed_id, milestone_day);

-- Enable Row Level Security
ALTER TABLE breed_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE breed_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE breed_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for breed_configurations
CREATE POLICY "Admins can manage breed configurations"
  ON breed_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Farmers can view active breed configurations"
  ON breed_configurations FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'FARMER'
    )
  );

-- Policies for breed_stages
CREATE POLICY "Admins can manage breed stages"
  ON breed_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Farmers can view breed stages"
  ON breed_stages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'FARMER'
    )
    AND EXISTS (
      SELECT 1 FROM breed_configurations
      WHERE breed_configurations.id = breed_stages.breed_id
      AND breed_configurations.is_active = true
    )
  );

-- Policies for breed_milestones
CREATE POLICY "Admins can manage breed milestones"
  ON breed_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Farmers can view breed milestones"
  ON breed_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'FARMER'
    )
    AND EXISTS (
      SELECT 1 FROM breed_configurations
      WHERE breed_configurations.id = breed_milestones.breed_id
      AND breed_configurations.is_active = true
    )
  );

-- Insert sample breed configurations
INSERT INTO breed_configurations (
  breed_name, breed_type, description,
  average_maturity_days, production_lifespan_days, average_weight_kg,
  eggs_per_year, feed_consumption_daily_grams, space_requirement_sqm,
  temperature_min_celsius, temperature_max_celsius,
  humidity_min_percent, humidity_max_percent
) VALUES
(
  'Broiler',
  'MEAT',
  'Fast-growing meat chicken optimized for high weight gain and efficient feed conversion. Ready for market in 6-8 weeks.',
  42,
  56,
  2.5,
  0,
  150,
  0.1,
  18,
  24,
  50,
  70
),
(
  'Layer (Commercial)',
  'EGG',
  'High-production egg-laying chickens bred for consistent egg production. Peak production at 24-72 weeks.',
  140,
  520,
  1.8,
  300,
  110,
  0.15,
  16,
  24,
  50,
  75
),
(
  'Kienyeji (Indigenous)',
  'DUAL_PURPOSE',
  'Hardy local chicken breed adapted to Kenyan climate. Good for both meat and eggs with minimal input requirements.',
  180,
  730,
  1.5,
  150,
  80,
  0.2,
  15,
  30,
  40,
  80
)
ON CONFLICT (breed_name) DO NOTHING;
