import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'FARMER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalize = (v: any) => String(v || '').toUpperCase();
  const userRole = normalize(user.role);
  const normalizedRequiredRole = requiredRole ? normalize(requiredRole) : null;

  if (normalizedRequiredRole && userRole !== normalizedRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
