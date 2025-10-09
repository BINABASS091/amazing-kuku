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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'ADMIN' | 'FARMER', farmerDetails?: FarmerDetails) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retries = 0): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);

      if (retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchUserProfile(userId, retries + 1);
      }
      return null;
    }

    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Wait for the user profile to be loaded by the auth state change
    // The App component will handle role-based redirection
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
