import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, MapPin, Calendar, Package, Plus, Activity, Radio, CreditCard as Edit, Trash2, CheckCircle } from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  location: string;
  size_hectares: number | null;
  status: string;
  created_at: string;
}

interface Batch {
  id: string;
  batch_number: string;
  breed: string;
  quantity: number;
  start_date: string;
  status: string;
  mortality_count: number;
  current_age_days: number;
}

interface FarmActivity {
  id: string;
  activity_type: string;
  description: string;
  status: string;
  scheduled_date: string;
  completed_at: string | null;
  batch: {
    batch_number: string;
  };
}

interface Device {
  id: string;
  device_code: string;
  device_type: string;
  status: string;
  last_reading_at: string | null;
}

export function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [newBatch, setNewBatch] = useState({
    batch_number: '',
    breed: '',
    quantity: '',
    start_date: '',
  });

  const [newActivity, setNewActivity] = useState({
    batch_id: '',
    activity_type: 'FEEDING',
    description: '',
    scheduled_date: '',
  });

  const [newDevice, setNewDevice] = useState({
    device_code: '',
    device_type: 'SENSOR',
  });

  useEffect(() => {
    if (id && user) {
      fetchFarmDetails();
    }
  }, [id, user]);

  const fetchFarmDetails = async () => {
    try {
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (farmerError) {
        console.error('Error fetching farmer:', farmerError);
        return;
      }

      if (!farmer) {
        console.error('Farmer profile not found for user:', user?.id);
        return;
      }

      const [farmData, batchesData, devicesData] = await Promise.all([
        supabase
          .from('farms')
          .select('*')
          .eq('id', id)
          .eq('farmer_id', farmer.id)
          .maybeSingle(),
        supabase
          .from('batches')
          .select('*')
          .eq('farm_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('devices')
          .select('*')
          .eq('farm_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (farmData.error) {
        console.error('Error fetching farm:', farmData.error);
        throw farmData.error;
      }

      if (!farmData.data) {
        console.error('Farm not found or access denied. Farm ID:', id, 'Farmer ID:', farmer.id);
        setLoading(false);
        return;
      }

      console.log('Farm data loaded successfully:', farmData.data);
      setFarm(farmData.data);
      setBatches(batchesData.data || []);
      setDevices(devicesData.data || []);

      const batchIds = (batchesData.data || []).map(b => b.id);

      if (batchIds.length > 0) {
        const { data: activitiesData } = await supabase
          .from('activities')
          .select(`
            *,
            batch:batches(batch_number)
          `)
          .eq('farmer_id', farmer.id)
          .in('batch_id', batchIds)
          .order('scheduled_date', { ascending: false });

        setActivities(activitiesData as any || []);
      }
    } catch (error) {
      console.error('Error fetching farm details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('batches').insert({
        farm_id: id,
        batch_number: newBatch.batch_number,
        breed: newBatch.breed,
        quantity: parseInt(newBatch.quantity),
        start_date: newBatch.start_date,
        status: 'ACTIVE',
        mortality_count: 0,
        current_age_days: 0,
      });

      if (error) throw error;
      setShowBatchModal(false);
      setNewBatch({ batch_number: '', breed: '', quantity: '', start_date: '' });
      fetchFarmDetails();
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    try {
      const { error } = await supabase
        .from('batches')
        .update({
          batch_number: editingBatch.batch_number,
          breed: editingBatch.breed,
          quantity: editingBatch.quantity,
        })
        .eq('id', editingBatch.id);

      if (error) throw error;
      setShowBatchModal(false);
      setEditingBatch(null);
      fetchFarmDetails();
    } catch (error) {
      console.error('Error updating batch:', error);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const { error } = await supabase.from('batches').delete().eq('id', batchId);
      if (error) throw error;
      fetchFarmDetails();
    } catch (error) {
      console.error('Error deleting batch:', error);
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
      setShowActivityModal(false);
      setNewActivity({ batch_id: '', activity_type: 'FEEDING', description: '', scheduled_date: '' });
      fetchFarmDetails();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('devices').insert({
        farm_id: id,
        device_code: newDevice.device_code,
        device_type: newDevice.device_type,
        status: 'OFFLINE',
      });

      if (error) throw error;
      setShowDeviceModal(false);
      setNewDevice({ device_code: '', device_type: 'SENSOR' });
      fetchFarmDetails();
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  const markActivityCompleted = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('id', activityId);

      if (error) throw error;
      fetchFarmDetails();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Farm not found</p>
        <Link to="/farmer/farms" className="text-green-600 hover:text-green-700">
          Back to Farms
        </Link>
      </div>
    );
  }

  const stats = {
    totalBatches: batches.length,
    activeBatches: batches.filter(b => b.status === 'ACTIVE').length,
    totalBirds: batches.reduce((sum, b) => sum + (b.quantity - b.mortality_count), 0),
    pendingActivities: activities.filter(a => a.status === 'PENDING').length,
    onlineDevices: devices.filter(d => d.status === 'ONLINE').length,
  };

  return (
    <div>
      <Link
        to="/farmer/farms"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Farms
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{farm.name}</h1>
            <div className="flex items-center gap-4 mt-3 text-gray-600">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {farm.location}
              </span>
              {farm.size_hectares && (
                <span>{farm.size_hectares} hectares</span>
              )}
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Registered {new Date(farm.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              farm.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {farm.status}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.totalBatches}</p>
            <p className="text-sm text-gray-600">Total Batches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.activeBatches}</p>
            <p className="text-sm text-gray-600">Active Batches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalBirds}</p>
            <p className="text-sm text-gray-600">Total Birds</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.pendingActivities}</p>
            <p className="text-sm text-gray-600">Pending Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.onlineDevices}</p>
            <p className="text-sm text-gray-600">Devices Online</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Batches
            </h2>
            <button
              onClick={() => {
                setEditingBatch(null);
                setShowBatchModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Batch
            </button>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p>No batches yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{batch.batch_number}</p>
                      <p className="text-sm text-gray-600">{batch.breed}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBatch(batch);
                          setShowBatchModal(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{batch.quantity - batch.mortality_count} birds</span>
                    <span>{batch.current_age_days} days old</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        batch.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-orange-600" />
              Activities
            </h2>
            {batches.length === 0 ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm"
                  disabled
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-black text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  You need to add at least one batch before you can schedule activities.
                  <div className="absolute top-0 right-4 -mt-1 w-2 h-2 bg-black rotate-45"></div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowActivityModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p>No activities scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                          {activity.activity_type}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            activity.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : activity.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{activity.description || 'No description'}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Batch: {activity.batch.batch_number} • {new Date(activity.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    {activity.status === 'PENDING' && (
                      <button
                        onClick={() => markActivityCompleted(activity.id)}
                        className="ml-2 p-1 text-green-600 hover:text-green-800"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-green-600" />
            IoT Devices
          </h2>
          <button
            onClick={() => setShowDeviceModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Radio className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>No devices registered</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{device.device_code}</p>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      device.status === 'ONLINE'
                        ? 'bg-green-100 text-green-800'
                        : device.status === 'OFFLINE'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{device.device_type}</p>
                {device.last_reading_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last reading: {new Date(device.last_reading_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingBatch ? 'Edit Batch' : 'Add New Batch'}
            </h2>

            <form onSubmit={editingBatch ? handleUpdateBatch : handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={editingBatch ? editingBatch.batch_number : newBatch.batch_number}
                  onChange={(e) =>
                    editingBatch
                      ? setEditingBatch({ ...editingBatch, batch_number: e.target.value })
                      : setNewBatch({ ...newBatch, batch_number: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed
                </label>
                <input
                  type="text"
                  value={editingBatch ? editingBatch.breed : newBatch.breed}
                  onChange={(e) =>
                    editingBatch
                      ? setEditingBatch({ ...editingBatch, breed: e.target.value })
                      : setNewBatch({ ...newBatch, breed: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={editingBatch ? editingBatch.quantity : newBatch.quantity}
                  onChange={(e) =>
                    editingBatch
                      ? setEditingBatch({ ...editingBatch, quantity: parseInt(e.target.value) })
                      : setNewBatch({ ...newBatch, quantity: e.target.value })
                  }
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {!editingBatch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newBatch.start_date}
                    onChange={(e) => setNewBatch({ ...newBatch, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchModal(false);
                    setEditingBatch(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingBatch ? 'Save Changes' : 'Add Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Activity</h2>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch
                </label>
                <select
                  value={newActivity.batch_id}
                  onChange={(e) => setNewActivity({ ...newActivity, batch_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_number} - {batch.breed}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Optional description"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowActivityModal(false);
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

      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register Device</h2>

            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Code
                </label>
                <input
                  type="text"
                  value={newDevice.device_code}
                  onChange={(e) => setNewDevice({ ...newDevice, device_code: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="e.g., SENSOR-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type
                </label>
                <select
                  value={newDevice.device_type}
                  onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="SENSOR">Sensor</option>
                  <option value="FEEDER">Feeder</option>
                  <option value="WATER">Water System</option>
                  <option value="CAMERA">Camera</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeviceModal(false);
                    setNewDevice({ device_code: '', device_type: 'SENSOR' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
