import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface FarmerDetails {
  businessName?: string;
  location?: string;
  phoneNumber?: string;
  experienceYears?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (email: string, password: string, fullName: string, role: 'ADMIN' | 'FARMER', farmerDetails?: FarmerDetails) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retries = 0): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Ensure role is properly set and normalized to uppercase
      if (data) {
        data.role = data.role ? data.role.toUpperCase() : 'FARMER';
        // Store role in localStorage for immediate access
        localStorage.setItem('userRole', data.role);
        console.log('Fetched user profile with role:', data.role);
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Retry up to 3 times if the profile isn't immediately available
      if (retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(userId, retries + 1);
      }
      return null;
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initial auth check');
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', { hasSession: !!session, userId: session?.user?.id });
      (async () => {
        setSession(session);
        if (session?.user) {
          console.log('[AuthContext] Fetching user profile for:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          console.log('[AuthContext] Fetched profile:', { hasProfile: !!profile, role: profile?.role });
          setUser(profile);
        } else {
          console.log('[AuthContext] No active session found');
        }
        setLoading(false);
      })();
    }).catch(error => {
      console.error('[AuthContext] Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth state changed:', { 
        event: _event, 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      
      setSession(session);
      
      if (session?.user) {
        try {
          console.log('[AuthContext] User authenticated, fetching profile...');
          const profile = await fetchUserProfile(session.user.id);
          
          if (profile) {
            // Ensure role is properly set and normalized
            const userRole = profile.role ? profile.role.toUpperCase() : 'FARMER';
            const userWithRole = { 
              ...profile, 
              role: userRole,
              email: profile.email || session.user.email,
              id: profile.id || session.user.id
            };
            
            console.log('[AuthContext] Updating user state with role:', userRole);
            setUser(userWithRole);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userData', JSON.stringify(userWithRole));
          } else {
            console.warn('[AuthContext] No profile found for user');
            setUser(null);
          }
        } catch (error) {
          console.error('[AuthContext] Error updating user profile:', error);
          setUser(null);
        }
      } else {
        console.log('[AuthContext] No active session, clearing user data');
        // Clear user data on sign out
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Starting sign in process for:', email);
    setLoading(true);
    
    try {
      // Clear any existing auth state
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      setUser(null);
      setSession(null);
      
      console.log('[AuthContext] Attempting to authenticate with Supabase...');
      
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[AuthContext] Authentication error:', signInError);
        throw signInError;
      }

      if (!data?.user?.id) {
        const error = new Error('No user ID returned from authentication');
        console.error('[AuthContext]', error.message);
        throw error;
      }

      console.log('[AuthContext] User authenticated, ID:', data.user.id);
      
      // Fetch the user profile with retry logic
      console.log('[AuthContext] Fetching user profile...');
      let profile = await fetchUserProfile(data.user.id);
      
      // If profile doesn't exist, try to create one
      if (!profile) {
        console.log('[AuthContext] No profile found, creating one...');
        try {
          // First, try to insert the new user
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: email,
              full_name: email.split('@')[0],
              role: 'FARMER', // Default role
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (insertError) {
            // If the error is because the user already exists (but we couldn't fetch it), try to fetch again
            if (insertError.code === '23505') { // Unique violation
              console.log('[AuthContext] User exists but couldn\'t fetch, retrying...');
              profile = await fetchUserProfile(data.user.id);
              if (!profile) {
                throw new Error('User exists but profile could not be retrieved');
              }
            } else {
              throw insertError;
            }
          } else {
            profile = newProfile;
            console.log('[AuthContext] Created new user profile');
          }
        } catch (profileError) {
          console.error('[AuthContext] Error in profile creation/retrieval:', profileError);
          // Try one more time to fetch the profile in case it was created but not returned
          profile = await fetchUserProfile(data.user.id);
          if (!profile) {
            throw new Error('Failed to set up user profile: ' + (profileError instanceof Error ? profileError.message : String(profileError)));
          }
        }
      }

      // Ensure the role is properly set and normalized
      const userRole = profile?.role ? profile.role.toUpperCase() : 'FARMER';
      
      // Update the user state with the profile
      const updatedUser = {
        ...data.user,
        ...profile,
        role: userRole,
        email: profile?.email || email,
        full_name: profile?.full_name || email.split('@')[0],
        id: data.user.id
      };
      
      console.log('[AuthContext] Updating user state with:', updatedUser);
      setUser(updatedUser);
      setSession(data.session);

      // Store user data in localStorage for immediate access
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      console.log('[AuthContext] User signed in successfully with role:', userRole);
      return userRole;
      
    } catch (error) {
      console.error('Sign in error:', error);
      // Clear any partial state on error
      setUser(null);
      setSession(null);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in');
        }
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'ADMIN' | 'FARMER',
    farmerDetails?: FarmerDetails
  ) => {
    try {
      // First, sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth signup error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed - no user data returned');
      }

      // Create user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          email: data.user.email || email,
          full_name: fullName,
          role,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // If this is a farmer, create the farmer profile
      if (role === 'FARMER') {
        const { error: farmerError } = await supabase
          .from('farmers')
          .insert({
            user_id: data.user.id,
            business_name: farmerDetails?.businessName || null,
            location: farmerDetails?.location || null,
            phone_number: farmerDetails?.phoneNumber || null,
            experience_years: farmerDetails?.experienceYears || 0,
            verification_status: 'VERIFIED', // Auto-verify farmers on registration
          });

        if (farmerError) {
          console.error('Farmer profile creation error:', farmerError);
          throw new Error(`Failed to create farmer profile: ${farmerError.message}`);
        }
      }

      // Sign out the user so they need to log in
      await supabase.auth.signOut();
      
    } catch (error: any) {
      console.error('SignUp error:', error);
      
      // Provide more user-friendly error messages
      if (error.message?.includes('already registered')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (error.message?.includes('Password should be at least')) {
        throw new Error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('Unable to validate email address')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('duplicate key value')) {
        throw new Error('An account with this email already exists.');
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
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
