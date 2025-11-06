import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabaseClient';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'FARMER';
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Profile {
  id: string;
  email: string;
  role: 'ADMIN' | 'FARMER';
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  farmer_details?: {
    businessName?: string;
    location?: string;
    phoneNumber?: string;
    experienceYears?: number;
  } | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setProfile(null);
          return;
        }

        if (!session) {
          setUser(null);
          setProfile(null);
          return;
        }

        // Get user profile from users table
        console.log('Fetching user profile for ID:', session.user.id);
        
        // First, let's check if any users exist at all
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, role');
        
        console.log('All users in database:', allUsers, 'Error:', allUsersError);
        
        let { data: userData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          
          // Try to create the user profile if it doesn't exist
          if (profileError.code === 'PGRST116') { // No rows returned
            console.log('No user profile found, attempting to create one...');
            const { data: newUserData, error: insertError } = await supabase
              .from('users')
              .insert([{
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                phone: session.user.user_metadata?.phone || null,
                role: session.user.user_metadata?.role || 'FARMER'
              }])
              .select()
              .single();
              
            if (insertError) {
              console.error('Failed to create user profile:', insertError);
            } else {
              console.log('Created user profile:', newUserData);
              userData = newUserData;
              profileError = null; // Clear the error since we successfully created the profile
            }
          }
          
          // If still no profile, create a basic user object
          if (!userData) {
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              role: 'FARMER', // Default role
              user_metadata: {
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              },
            };
            setUser(basicUser);
            setProfile(null);
            return;
          }
        }

        // Update user state
        const user: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role || 'FARMER',
          user_metadata: {
            full_name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.email?.split('@')[0] || 'User',
          },
        };
        
        setUser(user);
        setProfile(userData);
        
        // Cache the profile
        localStorage.setItem('userProfile', JSON.stringify(userData));
        localStorage.setItem('userRole', userData.role || 'FARMER');
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setProfile(null);
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userRole');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkAuth();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('userProfile');
          localStorage.removeItem('userRole');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('Signing in with Supabase:', email);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        return { error: new Error(error.message) };
      }

      if (!data.user) {
        return { error: new Error('Sign in failed - no user returned') };
      }

      // Get user profile from users table
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', profileError);
      }

      // Create user object
      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        role: userData?.role || 'FARMER',
        user_metadata: {
          full_name: userData ? [userData.first_name, userData.last_name].filter(Boolean).join(' ') : 
                     data.user.user_metadata?.full_name || 
                     email.split('@')[0],
        },
      };
      
      setUser(user);
      setProfile(userData);
      
      // Cache the profile
      if (userData) {
        localStorage.setItem('userProfile', JSON.stringify(userData));
        localStorage.setItem('userRole', userData.role || 'FARMER');
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { 
        error: error instanceof Error ? error : new Error('Failed to sign in')
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Sign out with Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        return { error: new Error(error.message) };
      }
      
      // Clear cached data
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userRole');
      
      // Update state
      setUser(null);
      setProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { 
        error: error instanceof Error ? error : new Error('Failed to sign out')
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      
      // Extract user data from the userData object
      const firstName = userData?.first_name;
      const lastName = userData?.last_name;
      const phone = userData?.phone;
      const role = userData?.role || 'FARMER';
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: role,
            farmer_details: userData?.farmer_details
          }
        }
      });
      
      if (error) {
        console.error('Supabase sign up error:', error);
        return { error: new Error(error.message) };
      }
      
      // If user is created successfully but needs email confirmation
      if (data.user && !data.session) {
        return { error: null }; // Success, but email confirmation needed
      }
      
      // If user is created and session is active (auto-confirmation)
      if (data.user && data.session) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          role: 'FARMER',
          user_metadata: {
            full_name: firstName && lastName ? `${firstName} ${lastName}` : undefined,
          },
        };
        
        setUser(user);
        
        // Create profile data
        const profile: Profile = {
          id: data.user.id,
          email: data.user.email || email,
          role: 'FARMER',
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          created_at: new Date().toISOString(),
        };
        
        setProfile(profile);
        
        // Cache the profile
        localStorage.setItem('userProfile', JSON.stringify(profile));
        localStorage.setItem('userRole', 'FARMER');
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { 
        error: error instanceof Error ? error : new Error('Failed to sign up')
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
