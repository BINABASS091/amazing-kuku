import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bell, AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function AlertsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) return;

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('farmer_id', farmer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchesRead =
      readFilter === 'ALL' ||
      (readFilter === 'UNREAD' && !alert.is_read) ||
      (readFilter === 'READ' && alert.is_read);
    return matchesSeverity && matchesRead;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-500';
      case 'HIGH':
        return 'bg-orange-50 border-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-500';
      case 'LOW':
        return 'bg-blue-50 border-blue-500';
      default:
        return 'bg-gray-50 border-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HEALTH':
        return '🏥';
      case 'ENVIRONMENT':
        return '🌡️';
      case 'DEVICE':
        return '📱';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const stats = {
    total: alerts.length,
    unread: alerts.filter((a) => !a.is_read).length,
    critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('alerts.title')}</h1>
        <p className="text-gray-600 mt-2">{t('alerts.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('alerts.totalAlerts')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('alerts.unread')}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.unread}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('alerts.critical')}</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">{t('alerts.allSeverities')}</option>
            <option value="CRITICAL">{t('alerts.critical')}</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">{t('alerts.allStatus')}</option>
            <option value="UNREAD">{t('alerts.unread')}</option>
            <option value="READ">Read</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p>{t('alerts.noAlerts')}</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border-l-4 p-6 ${getSeverityColor(alert.severity)} ${
                !alert.is_read ? 'shadow-md' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{getTypeIcon(alert.alert_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-900">
                        {alert.severity}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-white text-gray-700 rounded-full">
                        {alert.alert_type}
                      </span>
                      {!alert.is_read && (
                        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!alert.is_read && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="px-4 py-2 text-sm bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
