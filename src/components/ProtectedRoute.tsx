import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'FARMER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    if (!loading) {
      console.log('ProtectedRoute - Auth state:', {
        hasUser: !!user,
        userRole: user?.role,
        requiredRole,
        path: location.pathname
      });
    }
  }, [user, loading, requiredRole, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize role comparison
  const userRole = (user.role || '').toUpperCase();
  const normalizedRequiredRole = requiredRole ? requiredRole.toUpperCase() : null;

  if (normalizedRequiredRole && userRole !== normalizedRequiredRole) {
    console.warn(`ProtectedRoute - Access denied. User role: ${userRole}, Required: ${normalizedRequiredRole}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
