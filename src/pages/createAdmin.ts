// createAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://firpwybscnrrywmuhbfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcnB3eWJzY25ycnl3bXVoYmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDc2NjYsImV4cCI6MjA3NDgyMzY2Nn0.ODdO-HtRKK3HGIOwk2ynzHomUgjmPxKlNWgDWHvYCAY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const email = 'admin@fugajipro.com';
  const password = 'admin123!';

  try {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'ADMIN'
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      console.log('Auth user created:', data.user);
      
      // Create profile in public.users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email,
          role: 'ADMIN',
          full_name: 'Admin User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) throw profileError;
      console.log('Admin profile created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();