-- Check if devices table exists and create if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devices') THEN
    CREATE TABLE IF NOT EXISTS public.devices (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
      serial_number text UNIQUE NOT NULL,
      device_name text NOT NULL DEFAULT 'Unnamed Device',
      device_type text NOT NULL CHECK (device_type IN (
        'TEMPERATURE_SENSOR', 'HUMIDITY_SENSOR', 'FEEDER', 'WATERER', 
        'CAMERA', 'CONTROLLER', 'AIR_QUALITY', 'WEIGHT_SCALE', 'SENSOR', 'WATER', 'OTHER'
      )),
      status text NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR')),
      last_reading_at timestamptz,
      last_online timestamptz DEFAULT now(),
      firmware_version text,
      installation_date date DEFAULT CURRENT_DATE,
      notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Enable read access for admins" 
      ON public.devices FOR SELECT 
      TO authenticated 
      USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
      ));
      
    CREATE POLICY "Enable read access for farm owners"
      ON public.devices FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = farm_id 
        AND farmer_id IN (
          SELECT id FROM public.farmers WHERE user_id = auth.uid()
        )
      ));
      
    RAISE NOTICE 'Created devices table';
  ELSE
    RAISE NOTICE 'Devices table already exists';
  END IF;
  
  -- Check if subscriptions table exists and create if it doesn't
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      farmer_id uuid REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
      plan_type text NOT NULL DEFAULT 'FREE' CHECK (plan_type IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
      status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
      start_date date NOT NULL,
      end_date date NOT NULL,
      amount decimal(10,2) NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Enable all access for admins"
      ON public.subscriptions FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
      ));
      
    CREATE POLICY "Enable read access for subscription owners"
      ON public.subscriptions FOR SELECT
      TO authenticated
      USING (farmer_id IN (
        SELECT id FROM public.farmers WHERE user_id = auth.uid()
      ));
      
    RAISE NOTICE 'Created subscriptions table';
  ELSE
    RAISE NOTICE 'Subscriptions table already exists';
  END IF;
  
  -- Create a default admin subscription if none exists
  IF NOT EXISTS (SELECT 1 FROM public.subscriptions LIMIT 1) THEN
    INSERT INTO public.subscriptions (
      farmer_id, 
      plan_type, 
      status, 
      start_date, 
      end_date, 
      amount
    )
    SELECT 
      f.id,
      'ENTERPRISE',
      'ACTIVE',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      0
    FROM public.farmers f
    JOIN public.users u ON f.user_id = u.id
    WHERE u.role = 'ADMIN'
    LIMIT 1;
    
    RAISE NOTICE 'Created default admin subscription';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error setting up tables: %', SQLERRM;
END $$;
