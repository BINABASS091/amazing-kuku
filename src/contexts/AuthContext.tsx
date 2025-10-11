import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase, User } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Extend the User type to include our custom fields
type AppUser = User & {
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
};

interface Profile {
  id: string;
  email: string;
  role: 'ADMIN' | 'FARMER';
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  farmer_details?: FarmerDetails | null;
}

interface FarmerDetails {
  businessName?: string;
  location?: string;
  phoneNumber?: string;
  experienceYears?: number;
}

interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: 'google') => Promise<{ error: Error | null }>;
  resendVerification: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, retries = 0): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Ensure role is properly set and normalized to uppercase
      if (data) {
        const role = data.role ? (data.role as string).toUpperCase() : 'FARMER';
        // Store role in localStorage for immediate access
        localStorage.setItem('userRole', role);
        console.log('Fetched user profile with role:', role);
        
        const profileData: Profile = {
          id: data.id,
          email: data.email,
          role: role as 'ADMIN' | 'FARMER',
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          created_at: data.created_at,
          updated_at: data.updated_at,
          farmer_details: data.farmer_details
        };
        
        setProfile(profileData);
        return profileData;
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
  }, [setProfile]);

  // Memoize the fetch profile function to prevent recreation on each render
  const fetchAndSetProfile = useCallback(async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      if (profile) {
        // Update user state with minimal required fields
        setUser({
          id: userId,
          email: profile.email || '',
          user_metadata: {
            full_name: [profile.first_name, profile.last_name].filter(Boolean).join(' '),
            avatar_url: undefined
          },
          app_metadata: {
            provider: 'email'
          },
          role: profile.role
        } as AppUser);
      }
      return profile;
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      return null;
    }
  }, []);

  // Handle initial auth check
  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(initialSession);
          
          if (initialSession?.user) {
            await fetchAndSetProfile(initialSession.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        
        if (session?.user) {
          try {
            // Check if user already exists in the users table
            const { data: existingUser } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            // Only create a new user with default role if they don't exist
            if (!existingUser) {
              await supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  email: session.user.email ?? '',
                  role: 'FARMER',  // Default role for new users
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });
            }
          } catch (e) {
            console.error('Error ensuring profile exists:', e);
          }
          await fetchAndSetProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  // Clean up the AuthContext value to only include the necessary properties
  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.session) throw new Error('No session returned after sign in');

        // Fetch user profile after successful sign in
        if (data.user) {
          await fetchAndSetProfile(data.user.id);
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
    },
    signUp: async (email: string, password: string, userData: Partial<Profile>) => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email,
              role: userData.role || 'FARMER',
              ...userData
            }
          }
        });

        if (error) throw error;

        // Create profile in the database
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email,
              ...userData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) throw profileError;
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
    },
    signOut: async () => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear all auth related state
        setUser(null);
        setSession(null);
        setProfile(null);
        localStorage.removeItem('userRole');
        
        return { error: null };
      } catch (error) {
        console.error('Error signing out:', error);
        return { 
          error: error instanceof Error ? error : new Error('Failed to sign out')
        };
      } finally {
        setLoading(false);
      }
    },
    updateProfile: async (updates: Partial<Profile>) => {
      if (!user) return { error: new Error('Not authenticated') };
      
      try {
        const { error } = await supabase
          .from('users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) throw error;
        
        // Refresh the profile data
        await fetchUserProfile(user.id);
        
        return { error: null };
      } catch (error) {
        console.error('Error updating profile:', error);
        return { 
          error: error instanceof Error ? error : new Error('Failed to update profile')
        };
      }
    },
    signInWithProvider: async (provider: 'google') => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        // For OAuth, user will be redirected; return success for caller
        return { error: null };
      } catch (error) {
        console.error('Error with OAuth sign-in:', error);
        return { error: error instanceof Error ? error : new Error('Failed to sign in with provider') };
      } finally {
        setLoading(false);
      }
    },
    resendVerification: async (email: string) => {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) throw error;
        return { error: null };
      } catch (error) {
        console.error('Error resending verification:', error);
        return { error: error instanceof Error ? error : new Error('Failed to resend verification email') };
      }
    }
  }), [session, user, profile, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
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