import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://firpwybscnrrywmuhbfx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcnB3eWJzY25ycnl3bXVoYmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDc2NjYsImV4cCI6MjA3NDgyMzY2Nn0.ODdO-HtRKK3HGIOwk2ynzHomUgjmPxKlNWgDWHvYCAY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  const adminEmail = 'admin@fugajipro.com';
  const adminPassword = 'StrongAdminPassword123!'; // Change this to a strong password
  const adminFullName = 'Admin User';

  try {
    console.log('Creating admin user...');
    
    // 1. Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminFullName,
          email: adminEmail,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No user returned after sign up');

    console.log('Auth user created, ID:', authData.user.id);

    // 2. Insert user profile with ADMIN role
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: adminEmail,
          full_name: adminFullName,
          role: 'ADMIN',
          phone: null,
          avatar_url: null,
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User ID:', authData.user.id);
    console.log('Profile:', profileData);

  } catch (error) {
    console.error('Error creating admin user:');
    console.error(error);
    
    // Check if user already exists
    if (error.message?.includes('already registered')) {
      console.log('\nUser already exists. Updating role to ADMIN...');
      
      // Try to update existing user to admin
      try {
        // First, get the user by email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', adminEmail)
          .single();
          
        if (userError) throw userError;
        
        // Update the user's role to ADMIN
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ role: 'ADMIN' })
          .eq('id', userData.id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        console.log('\nSuccessfully updated user to ADMIN:');
        console.log('Email:', adminEmail);
        console.log('User ID:', userData.id);
        console.log('Updated Profile:', updateData);
        
      } catch (updateError) {
        console.error('Error updating user to admin:');
        console.error(updateError);
      }
    }
  }
}

// Run the function
createAdminUser();
