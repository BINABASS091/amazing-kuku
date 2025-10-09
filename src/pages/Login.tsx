import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, session } = useAuth();
  const navigate = useNavigate();

  // Handle redirect after successful authentication
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (session && !loading) {
        // Try to get role from multiple sources
        let role = '';
        
        // 1. Check user object from context
        if (user?.role) {
          role = user.role.toUpperCase();
        } 
        // 2. Check localStorage
        else if (localStorage.getItem('userRole')) {
          role = localStorage.getItem('userRole')?.toUpperCase() || '';
        }
        // 3. If still no role, try to fetch it
        else if (session.user?.id) {
          try {
            const { data: profile, error } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();
              
            if (!error && profile?.role) {
              role = profile.role.toUpperCase();
              // Update localStorage for future use
              localStorage.setItem('userRole', role);
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
          }
        }
        
        console.log('Auth state changed:', { 
          hasSession: !!session, 
          userRole: role,
          userData: user,
          sessionUser: session.user
        });
        
        // Handle redirection based on role
        if (role === 'ADMIN') {
          console.log('Admin user detected, redirecting to /admin');
          navigate('/admin', { replace: true });
        } else if (role) {
          console.log('User detected, redirecting to /farmer');
          navigate('/farmer', { replace: true });
        } else {
          console.warn('No role found, using default route');
          navigate('/farmer', { replace: true });
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [session, user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await signIn(email, password);
      console.log('Sign in successful, role from signIn:', role);
      
      // The useEffect will handle the redirection based on the updated auth state
      // We don't need to navigate here as the effect will trigger with the new session
      
      // Just in case the effect doesn't trigger, set a small timeout
      setTimeout(() => {
        if (session && user) {
          const finalRole = (user.role || role || '').toUpperCase();
          console.log('Final role after timeout:', finalRole);
          if (finalRole === 'ADMIN') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/farmer', { replace: true });
          }
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'FARMER_NOT_VERIFIED') {
        setError(t('auth.notVerified') || 'Your account is not yet verified. Please contact support.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again later.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="https://res.cloudinary.com/diyy8h0d9/image/upload/v1759477181/WhatsApp_Image_2025-09-10_at_10.41.48_AM_klrrtu.jpg" 
                alt="FugajiPro Logo" 
                className="w-42 h-30 mx-auto rounded-lg object-contain shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Manage Your Poultry</h1>
            <h3 className="text-3xl font-bold text-green-600 mb-2">With FugajiPro</h3>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-green-600 hover:text-green-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
