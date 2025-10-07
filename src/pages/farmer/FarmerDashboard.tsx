import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Alert } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { StatCard } from '../../components/StatCard';
import { Warehouse, Package, AlertTriangle, Activity, TrendingUp, Radio, Calendar, Plus } from 'lucide-react';

export function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalFarms: 0,
    activeFarms: 0,
    totalBatches: 0,
    activeBatches: 0,
    totalBirds: 0,
    totalDevices: 0,
    onlineDevices: 0,
    unreadAlerts: 0,
    criticalAlerts: 0,
    pendingActivities: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [recentBatches, setRecentBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) return;

      const { data: farmsData } = await supabase
        .from('farms')
        .select('id, status')
        .eq('farmer_id', farmer.id);

      const farmIds = (farmsData || []).map(f => f.id);
      const activeFarmsCount = (farmsData || []).filter(f => f.status === 'ACTIVE').length;

      let batchesData: any[] = [];
      let devicesData: any[] = [];
      let totalBirds = 0;

      if (farmIds.length > 0) {
        const { data: batches } = await supabase
          .from('batches')
          .select('*')
          .in('farm_id', farmIds);

        batchesData = batches || [];
        totalBirds = batchesData.reduce((sum, b) => sum + (b.quantity - b.mortality_count), 0);

        const { data: devices } = await supabase
          .from('devices')
          .select('*')
          .in('farm_id', farmIds);

        devicesData = devices || [];
      }

      const [alertsCount, criticalAlertsCount, activitiesCount, alertsData, recentBatchesData] = await Promise.all([
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', farmer.id)
          .eq('is_read', false),
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', farmer.id)
          .eq('severity', 'CRITICAL')
          .eq('is_read', false),
        supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', farmer.id)
          .eq('status', 'PENDING'),
        supabase
          .from('alerts')
          .select('*')
          .eq('farmer_id', farmer.id)
          .order('created_at', { ascending: false })
          .limit(5),
        farmIds.length > 0 ? supabase
          .from('batches')
          .select('*, farm:farms(name)')
          .in('farm_id', farmIds)
          .order('created_at', { ascending: false })
          .limit(3) : Promise.resolve({ data: [] }),
      ]);

      setStats({
        totalFarms: (farmsData || []).length,
        activeFarms: activeFarmsCount,
        totalBatches: batchesData.length,
        activeBatches: batchesData.filter(b => b.status === 'ACTIVE').length,
        totalBirds: totalBirds,
        totalDevices: devicesData.length,
        onlineDevices: devicesData.filter(d => d.status === 'ONLINE').length,
        unreadAlerts: alertsCount.count || 0,
        criticalAlerts: criticalAlertsCount.count || 0,
        pendingActivities: activitiesCount.count || 0,
      });

      setRecentAlerts(alertsData.data || []);
      setRecentBatches(recentBatchesData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.welcome')}, {user?.full_name}!</h1>
        <p className="text-gray-600 mt-2">{t('dashboard.welcomeMessage')}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('dashboard.activeFarms')}</p>
              <p className="text-3xl font-bold mt-2">{stats.activeFarms}</p>
              <p className="text-blue-100 text-xs mt-1">{t('dashboard.ofTotal')} {stats.totalFarms} {t('dashboard.total')}</p>
            </div>
            <Warehouse className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('dashboard.totalBirds')}</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBirds.toLocaleString()}</p>
              <p className="text-green-100 text-xs mt-1">{stats.activeBatches} {t('batches.activeBatches')}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">{t('dashboard.alerts')}</p>
              <p className="text-3xl font-bold mt-2">{stats.criticalAlerts}</p>
              <p className="text-red-100 text-xs mt-1">{stats.unreadAlerts} {t('dashboard.totalUnread')}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t('dashboard.totalBatches')}
          value={stats.totalBatches}
          icon={Package}
          color="blue"
        />
        <StatCard
          title={t('dashboard.onlineDevices')}
          value={stats.onlineDevices}
          icon={Radio}
          color="green"
        />
        <StatCard
          title={t('dashboard.pendingActivities')}
          value={stats.pendingActivities}
          icon={Activity}
          color="orange"
        />
        <StatCard
          title={t('dashboard.totalDevices')}
          value={stats.totalDevices}
          icon={Radio}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentBatches')}</h2>
            <Link to="/farmer/batches" className="text-sm text-green-600 hover:text-green-700 font-medium">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {recentBatches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p>{t('dashboard.noBatchesYet')}</p>
              <Link to="/farmer/batches" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">
                {t('dashboard.addFirstBatch')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBatches.map((batch: any) => (
                <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{batch.batch_number}</p>
                      <p className="text-sm text-gray-600">{batch.farm?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{batch.quantity} birds</p>
                    <p className="text-xs text-gray-600">{batch.breed}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('dashboard.quickActions')}</h2>
          <div className="space-y-3">
            <Link
              to="/farmer/farms"
              className="flex items-center gap-3 w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('dashboard.addNewFarm')}
            </Link>
            <Link
              to="/farmer/batches"
              className="flex items-center gap-3 w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('dashboard.addNewBatch')}
            </Link>
            <Link
              to="/farmer/activities"
              className="flex items-center gap-3 w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-lg font-medium hover:bg-orange-100 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              {t('dashboard.viewActivities')}
            </Link>
            <Link
              to="/farmer/knowledge"
              className="flex items-center gap-3 w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors"
            >
              <Activity className="w-5 h-5" />
              {t('dashboard.browseTips')}
            </Link>
          </div>
        </div>
      </div>

      {recentAlerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <span className="text-sm text-gray-600">{stats.unreadAlerts} unread</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-50 border-red-500'
                    : alert.severity === 'HIGH'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{alert.message}</p>
                <p className="text-xs text-gray-600">
                  {new Date(alert.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
