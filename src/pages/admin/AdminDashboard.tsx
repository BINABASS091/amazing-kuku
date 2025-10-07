import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/StatCard';
import { Users, UserCheck, Warehouse, Package, Radio, AlertTriangle, Activity, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    verifiedFarmers: 0,
    pendingFarmers: 0,
    totalFarms: 0,
    activeFarms: 0,
    totalBatches: 0,
    activeBatches: 0,
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0,
    criticalAlerts: 0,
    unreadAlerts: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        usersCount,
        farmersCount,
        verifiedFarmersCount,
        pendingFarmersCount,
        farmsCount,
        activeFarmsCount,
        batchesCount,
        activeBatchesCount,
        devicesCount,
        activeDevicesCount,
        offlineDevicesCount,
        criticalAlertsCount,
        unreadAlertsCount,
        subscriptionsCount,
        activeSubscriptionsCount
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('farmers').select('*', { count: 'exact', head: true }),
        supabase.from('farmers').select('*', { count: 'exact', head: true }).eq('verification_status', 'VERIFIED'),
        supabase.from('farmers').select('*', { count: 'exact', head: true }).eq('verification_status', 'PENDING'),
        supabase.from('farms').select('*', { count: 'exact', head: true }),
        supabase.from('farms').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('batches').select('*', { count: 'exact', head: true }),
        supabase.from('batches').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'ONLINE'),
        supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'OFFLINE'),
        supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('severity', 'CRITICAL').eq('is_read', false),
        supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalFarmers: farmersCount.count || 0,
        verifiedFarmers: verifiedFarmersCount.count || 0,
        pendingFarmers: pendingFarmersCount.count || 0,
        totalFarms: farmsCount.count || 0,
        activeFarms: activeFarmsCount.count || 0,
        totalBatches: batchesCount.count || 0,
        activeBatches: activeBatchesCount.count || 0,
        totalDevices: devicesCount.count || 0,
        activeDevices: activeDevicesCount.count || 0,
        offlineDevices: offlineDevicesCount.count || 0,
        criticalAlerts: criticalAlertsCount.count || 0,
        unreadAlerts: unreadAlertsCount.count || 0,
        totalSubscriptions: subscriptionsCount.count || 0,
        activeSubscriptions: activeSubscriptionsCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data: recentFarmers } = await supabase
        .from('farmers')
        .select('id, created_at, user:users(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = (recentFarmers || []).map((farmer: any) => ({
        id: farmer.id,
        type: 'farmer_signup',
        message: `${farmer.user.full_name} registered as a new farmer`,
        timestamp: farmer.created_at,
        user: farmer.user.full_name,
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive overview of your Smart Kuku platform</p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Verified Farmers</p>
              <p className="text-3xl font-bold mt-2">{stats.verifiedFarmers}</p>
              <p className="text-green-100 text-xs mt-1">{stats.pendingFarmers} pending</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Farms</p>
              <p className="text-3xl font-bold mt-2">{stats.activeFarms}</p>
              <p className="text-orange-100 text-xs mt-1">of {stats.totalFarms} total</p>
            </div>
            <Warehouse className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Critical Alerts</p>
              <p className="text-3xl font-bold mt-2">{stats.criticalAlerts}</p>
              <p className="text-red-100 text-xs mt-1">{stats.unreadAlerts} unread</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Batches"
          value={stats.activeBatches}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Online Devices"
          value={stats.activeDevices}
          icon={Radio}
          color="green"
        />
        <StatCard
          title="Offline Devices"
          value={stats.offlineDevices}
          icon={Radio}
          color="orange"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={DollarSign}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No recent activities
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/admin/farmers"
              className="block w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              Manage Farmers
            </Link>
            <Link
              to="/admin/subscriptions"
              className="block w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Manage Subscriptions
            </Link>
            <Link
              to="/admin/recommendations"
              className="block w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
            >
              Add Recommendations
            </Link>
            <Link
              to="/admin/alerts"
              className="block w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              View Alerts
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Database Status</p>
              <p className="text-lg font-semibold text-gray-900">Healthy</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">API Status</p>
              <p className="text-lg font-semibold text-gray-900">Operational</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Device Network</p>
              <p className="text-lg font-semibold text-gray-900">Connected</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
