import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Bell, Calendar } from 'lucide-react';

interface Alert {
  id: string;
  farmer_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  is_read: boolean;
  created_at: string;
  farmer?: {
    user: {
      full_name: string;
      email: string;
    };
  } | null;
}

export function AlertsManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          farmer:farmers(
            user:users(full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data as any) || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const { error } = await supabase.from('alerts').delete().eq('id', id);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'ALL' || alert.alert_type === typeFilter;
    const matchesRead =
      readFilter === 'ALL' ||
      (readFilter === 'UNREAD' && !alert.is_read) ||
      (readFilter === 'READ' && alert.is_read);
    return matchesSeverity && matchesType && matchesRead;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
    high: alerts.filter((a) => a.severity === 'HIGH').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
        <p className="text-gray-600 mt-2">Monitor and manage system alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.unread}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.critical}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{stats.high}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="HEALTH">Health</option>
            <option value="ENVIRONMENT">Environment</option>
            <option value="DEVICE">Device</option>
            <option value="SYSTEM">System</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No alerts found
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg border-l-4 p-6 ${getSeverityColor(
                alert.severity
              )} ${!alert.is_read ? 'shadow-md' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{getTypeIcon(alert.alert_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {alert.alert_type}
                      </span>
                      {!alert.is_read && (
                        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(alert.created_at)}
                      </span>
                      {alert.farmer && (
                        <span>Farmer: {alert.farmer.user.full_name}</span>
                      )}
                      {!alert.farmer_id && <span>System Alert</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!alert.is_read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
