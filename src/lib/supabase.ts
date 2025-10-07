import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'ADMIN' | 'FARMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  user_id: string;
  business_name: string | null;
  location: string | null;
  phone_number: string | null;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  experience_years: number;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  farmer_id: string;
  name: string;
  location: string;
  size_hectares: number | null;
  latitude: number | null;
  longitude: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  farm_id: string;
  batch_number: string;
  breed: string;
  quantity: number;
  start_date: string;
  expected_end_date: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CLOSED';
  mortality_count: number;
  current_age_days: number;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  farm_id: string;
  device_code: string;
  device_type: 'SENSOR' | 'FEEDER' | 'WATER' | 'CAMERA';
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  last_reading_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  farmer_id: string | null;
  alert_type: 'HEALTH' | 'ENVIRONMENT' | 'DEVICE' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  batch_id: string;
  farmer_id: string;
  activity_type: 'FEEDING' | 'VACCINATION' | 'CLEANING' | 'INSPECTION' | 'OTHER';
  description: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  scheduled_date: string;
  completed_at: string | null;
  created_at: string;
}
