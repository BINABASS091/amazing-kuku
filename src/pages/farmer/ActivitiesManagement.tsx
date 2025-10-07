import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calendar, CheckCircle, Clock, Plus } from 'lucide-react';

interface Activity {
  id: string;
  batch_id: string;
  activity_type: string;
  description: string;
  status: string;
  scheduled_date: string;
  completed_at: string | null;
  batch: {
    batch_number: string;
    farm: {
      name: string;
    };
  };
}

interface Batch {
  id: string;
  batch_number: string;
  breed: string;
  farm: {
    id: string;
    name: string;
  };
}

export function ActivitiesManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    batch_id: '',
    activity_type: 'FEEDING',
    description: '',
    scheduled_date: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) return;

      const { data: farmsData } = await supabase
        .from('farms')
        .select('id, name')
        .eq('farmer_id', farmer.id);

      const farmIds = (farmsData || []).map(f => f.id);

      if (farmIds.length > 0) {
        const [activitiesData, batchesData] = await Promise.all([
          supabase
            .from('activities')
            .select(`
              *,
              batch:batches(
                batch_number,
                farm:farms(name)
              )
            `)
            .eq('farmer_id', farmer.id)
            .order('scheduled_date', { ascending: false }),
          supabase
            .from('batches')
            .select(`
              id,
              batch_number,
              breed,
              farm:farms(id, name)
            `)
            .in('farm_id', farmIds)
            .eq('status', 'ACTIVE')
        ]);

        setActivities((activitiesData.data as any) || []);
        setBatches((batchesData.data as any) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'ALL') return true;
    return activity.status === filter;
  });

  const markAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) return;

      const { error } = await supabase.from('activities').insert({
        farmer_id: farmer.id,
        batch_id: newActivity.batch_id,
        activity_type: newActivity.activity_type,
        description: newActivity.description,
        scheduled_date: newActivity.scheduled_date,
        status: 'PENDING',
      });

      if (error) throw error;
      
      setShowAddModal(false);
      setNewActivity({ batch_id: '', activity_type: 'FEEDING', description: '', scheduled_date: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'FEEDING':
        return '🥣';
      case 'VACCINATION':
        return '💉';
      case 'CLEANING':
        return '🧹';
      case 'INSPECTION':
        return '🔍';
      default:
        return '📋';
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
    total: activities.length,
    pending: activities.filter(a => a.status === 'PENDING').length,
    completed: activities.filter(a => a.status === 'COMPLETED').length,
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('activities.title')}</h1>
            <p className="text-gray-600 mt-2">{t('activities.subtitle')}</p>
          </div>
          {batches.length > 0 ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Activity
            </button>
          ) : (
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                disabled
              >
                <Plus className="w-5 h-5" />
                Add Activity
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-black text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                You need to have at least one active batch to schedule activities.
                <div className="absolute top-0 right-4 -mt-1 w-2 h-2 bg-black rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('activities.totalActivities')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('activities.pending')}</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('activities.completed')}</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.completed}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">{t('activities.allActivities')}</option>
            <option value="PENDING">{t('activities.pending')}</option>
            <option value="COMPLETED">{t('activities.completed')}</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-600 mb-4">
              {activities.length === 0 
                ? "You haven't scheduled any activities yet."
                : "No activities match your current filter."
              }
            </p>
            {activities.length === 0 && batches.length > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Schedule Your First Activity
              </button>
            )}
            {batches.length === 0 && (
              <p className="text-sm text-gray-500">
                You need to create active batches first to schedule activities.
              </p>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{getActivityIcon(activity.activity_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {activity.activity_type}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{activity.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Batch: {activity.batch.batch_number}</span>
                      <span>Farm: {activity.batch.farm.name}</span>
                      <span>Scheduled: {new Date(activity.scheduled_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {activity.status === 'PENDING' && (
                  <button
                    onClick={() => markAsCompleted(activity.id)}
                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule New Activity</h2>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch
                </label>
                <select
                  value={newActivity.batch_id}
                  onChange={(e) => setNewActivity({ ...newActivity, batch_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_number} - {batch.breed} ({batch.farm.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type
                </label>
                <select
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="FEEDING">Feeding</option>
                  <option value="VACCINATION">Vaccination</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="INSPECTION">Inspection</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="Optional description of the activity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={newActivity.scheduled_date}
                  onChange={(e) => setNewActivity({ ...newActivity, scheduled_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewActivity({ batch_id: '', activity_type: 'FEEDING', description: '', scheduled_date: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Schedule Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
