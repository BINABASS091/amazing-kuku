import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Search, AlertCircle, Calendar, Activity, TrendingUp } from 'lucide-react';

interface Batch {
  id: string;
  batch_number: string;
  breed: string;
  quantity: number;
  start_date: string;
  expected_end_date?: string;
  status: string;
  mortality_count: number;
  current_age_days: number;
  farm_id: string;
  created_at: string;
  updated_at: string;
  farm: {
    name: string;
    location: string;
    farmer: {
      id: string;
      user: {
        full_name: string;
      };
    };
  };
}

interface BatchFormData {
  batch_number: string;
  breed: string;
  quantity: string;
  start_date: string;
  expected_end_date: string;
  status: string;
  mortality_count: string;
  current_age_days: string;
  farm_id: string;
}

export function AllBatchesManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BatchFormData>({
    batch_number: '',
    breed: '',
    quantity: '',
    start_date: '',
    expected_end_date: '',
    status: 'ACTIVE',
    mortality_count: '0',
    current_age_days: '0',
    farm_id: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchFarms();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          farm:farms(
            name,
            location,
            farmer:farmers(
              id,
              user:users(full_name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          id,
          name,
          location,
          farmer:farmers(user:users(full_name))
        `)
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const batchData = {
        batch_number: formData.batch_number,
        breed: formData.breed,
        quantity: parseInt(formData.quantity),
        start_date: formData.start_date,
        expected_end_date: formData.expected_end_date || null,
        status: formData.status,
        mortality_count: parseInt(formData.mortality_count),
        current_age_days: parseInt(formData.current_age_days),
        farm_id: formData.farm_id,
      };

      if (editingBatch) {
        const { error } = await supabase
          .from('batches')
          .update(batchData)
          .eq('id', editingBatch.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('batches')
          .insert([batchData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingBatch(null);
      resetForm();
      fetchBatches();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This will also delete all associated activities and records.')) return;

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBatches();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      batch_number: batch.batch_number,
      breed: batch.breed,
      quantity: batch.quantity.toString(),
      start_date: batch.start_date,
      expected_end_date: batch.expected_end_date || '',
      status: batch.status,
      mortality_count: batch.mortality_count.toString(),
      current_age_days: batch.current_age_days.toString(),
      farm_id: batch.farm_id,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      batch_number: '',
      breed: '',
      quantity: '',
      start_date: '',
      expected_end_date: '',
      status: 'ACTIVE',
      mortality_count: '0',
      current_age_days: '0',
      farm_id: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateSurvivalRate = (quantity: number, mortality: number): number => {
    if (quantity === 0) return 0;
    return ((quantity - mortality) / quantity) * 100;
  };

  const formatSurvivalRate = (quantity: number, mortality: number): string => {
    return calculateSurvivalRate(quantity, mortality).toFixed(1);
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farm.farmer.user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || batch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: batches.length,
    active: batches.filter((b) => b.status === 'ACTIVE').length,
    completed: batches.filter((b) => b.status === 'COMPLETED').length,
    totalBirds: batches.reduce((sum, b) => sum + b.quantity, 0),
    avgSurvivalRate: batches.length > 0
      ? (batches.reduce((sum, b) => sum + calculateSurvivalRate(b.quantity, b.mortality_count), 0) / batches.length).toFixed(1)
      : 0,
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Batches Management</h1>
          <p className="text-gray-600 mt-2">Manage all poultry batches across the platform</p>
        </div>
        <button
          onClick={() => {
            setEditingBatch(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Batches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Activity className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Batches</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.completed}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Birds</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBirds.toLocaleString()}</p>
            </div>
            <Activity className="w-12 h-12 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Survival Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.avgSurvivalRate}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search batches by number, breed, farm, or farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farm & Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age (Days)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Survival Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No batches found
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
                        <div className="text-sm text-gray-500">
                          Started: {new Date(batch.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{batch.farm.name}</div>
                        <div className="text-sm text-gray-500">{batch.farm.farmer.user.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.breed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{batch.quantity.toLocaleString()}</div>
                        <div className="text-sm text-red-500">Deaths: {batch.mortality_count}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.current_age_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${calculateSurvivalRate(batch.quantity, batch.mortality_count)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatSurvivalRate(batch.quantity, batch.mortality_count)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          batch.status
                        )}`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(batch)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit Batch"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingBatch ? 'Edit Batch' : 'Add New Batch'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., BATCH-2025-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breed *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., Broiler, Layer, Kienyeji"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected End Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_end_date}
                      onChange={(e) => setFormData({ ...formData, expected_end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Age (Days) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.current_age_days}
                      onChange={(e) => setFormData({ ...formData, current_age_days: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 21"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mortality Count *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.mortality_count}
                      onChange={(e) => setFormData({ ...formData, mortality_count: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm *
                    </label>
                    <select
                      required
                      value={formData.farm_id}
                      onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select an active farm</option>
                      {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name} - {farm.location} ({farm.farmer.user.full_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBatch(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingBatch ? 'Update Batch' : 'Add Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
