import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FarmersManagement } from './pages/admin/FarmersManagement';
import { FarmerDetail } from './pages/admin/FarmerDetail';
import { SubscriptionsManagement } from './pages/admin/SubscriptionsManagement';
import { RecommendationsManagement } from './pages/admin/RecommendationsManagement';
import { AlertsManagement } from './pages/admin/AlertsManagement';
import { DevicesManagement } from './pages/admin/DevicesManagement';
import { AllFarmsManagement } from './pages/admin/AllFarmsManagement';
import { AllBatchesManagement } from './pages/admin/AllBatchesManagement';
import { BreedConfigurations } from './pages/admin/BreedConfigurations';
import { Settings } from './pages/admin/Settings';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FarmsManagement } from './pages/farmer/FarmsManagement';
import { FarmDetail } from './pages/farmer/FarmDetail';
import { BatchesManagement } from './pages/farmer/BatchesManagement';
import { ActivitiesManagement } from './pages/farmer/ActivitiesManagement';
import { KnowledgeBase } from './pages/farmer/KnowledgeBase';
import { AlertsPage } from './pages/farmer/AlertsPage';
import { ProfilePage } from './pages/farmer/ProfilePage';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/farmer'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/farmers"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <FarmersManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/farmers/:id"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <FarmerDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
                    <p className="text-gray-600 mt-2">Coming soon</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/farms"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <AllFarmsManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/batches"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <AllBatchesManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <DevicesManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <SubscriptionsManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/recommendations"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <RecommendationsManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <AlertsManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/breeds"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <BreedConfigurations />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <FarmerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/farms"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <FarmsManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/farms/:id"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <FarmDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/batches"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <BatchesManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/activities"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <ActivitiesManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/knowledge"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <KnowledgeBase />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/alerts"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <AlertsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/profile"
            element={
              <ProtectedRoute requiredRole="FARMER">
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
