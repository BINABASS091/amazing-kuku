import { Suspense, lazy } from 'react';
import { ToastProvider } from './components/ui/toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

// Lazy load pages with proper named export handling for React components  
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const FarmersManagement = lazy(() => import('./pages/admin/FarmersManagement').then(module => ({ default: module.FarmersManagement })));
const FarmerDetail = lazy(() => import('./pages/admin/FarmerDetail').then(module => ({ default: module.FarmerDetail })));
const SubscriptionsManagement = lazy(() => import('./pages/admin/SubscriptionsManagement').then(module => ({ default: module.SubscriptionsManagement })));
const RecommendationsManagement = lazy(() => import('./pages/admin/RecommendationsManagement').then(module => ({ default: module.RecommendationsManagement })));
const AlertsManagement = lazy(() => import('./pages/admin/AlertsManagement').then(module => ({ default: module.AlertsManagement })));
const DevicesManagement = lazy(() => import('./pages/admin/DevicesManagement').then(module => ({ default: module.DevicesManagement })));
const AllFarmsManagement = lazy(() => import('./pages/admin/AllFarmsManagement').then(module => ({ default: module.AllFarmsManagement })));
const AllBatchesManagement = lazy(() => import('./pages/admin/AllBatchesManagement').then(module => ({ default: module.AllBatchesManagement })));
const BreedConfigurations = lazy(() => import('./pages/admin/BreedConfigurations').then(module => ({ default: module.BreedConfigurations })));
const Settings = lazy(() => import('./pages/admin/Settings').then(module => ({ default: module.Settings })));

// Lazy load farmer pages
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard').then(module => ({ default: module.FarmerDashboard })));
const FarmsManagement = lazy(() => import('./pages/farmer/FarmsManagement').then(module => ({ default: module.FarmsManagement })));
const FarmDetail = lazy(() => import('./pages/farmer/FarmDetail').then(module => ({ default: module.FarmDetail })));
const BatchesManagement = lazy(() => import('./pages/farmer/BatchesManagement').then(module => ({ default: module.BatchesManagement })));
const ActivitiesManagement = lazy(() => import('./pages/farmer/ActivitiesManagement').then(module => ({ default: module.ActivitiesManagement })));
const DiseasePrediction = lazy(() => import('./pages/disease-prediction')); // Uses default export
const KnowledgeBase = lazy(() => import('./pages/farmer/KnowledgeBase').then(module => ({ default: module.KnowledgeBase })));
const AlertsPage = lazy(() => import('./pages/farmer/AlertsPage').then(module => ({ default: module.AlertsPage })));
const ProfilePage = lazy(() => import('./pages/farmer/ProfilePage').then(module => ({ default: module.ProfilePage })));
const Subscription = lazy(() => import('./pages/farmer/Subscription')); // Uses default export
const InventoryManagement = lazy(() => import('./pages/farmer/InventoryManagement')); // Uses default export

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
);

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || '').toUpperCase();
  return <Navigate to={role === 'ADMIN' ? '/admin' : '/farmer'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SubscriptionProvider>
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/farmers" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <FarmersManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/farmers/:id" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <FarmerDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/farms" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <AllFarmsManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/batches" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <AllBatchesManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/devices" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <DevicesManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/subscriptions" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <SubscriptionsManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/recommendations" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <RecommendationsManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/alerts" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <AlertsManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/breeds" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <BreedConfigurations />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Farmer Routes */}
              <Route path="/farmer" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <FarmerDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/farms" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <FarmsManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/farms/:id" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <FarmDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/batches" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <BatchesManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/activities" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <ActivitiesManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/disease-prediction" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <DiseasePrediction />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/knowledge" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <KnowledgeBase />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/alerts" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <AlertsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/profile" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/subscription" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <Subscription />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/farmer/inventory" element={
                <ProtectedRoute requiredRole="FARMER">
                  <DashboardLayout>
                    <InventoryManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
          </Routes>
        </Suspense>
        </SubscriptionProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App; // Force deployment
