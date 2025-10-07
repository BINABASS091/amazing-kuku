import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Users, Grid2x2 as Grid, CreditCard as Edit2, Trash2, Search, AlertCircle, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Farm {
  id: string;
  name: string;
  location: string;
  size_hectares?: number;
  latitude?: number;
  longitude?: number;
  status: string;
  farmer_id: string;
  created_at: string;
  updated_at: string;
  farmer: {
    id: string;
    business_name?: string;
    user: {
      full_name: string;
      email: string;
      phone?: string;
    };
  };
  batches_count?: number;
  devices_count?: number;
}

interface FarmFormData {
  name: string;
  location: string;
  size_hectares: string;
  latitude: string;
  longitude: string;
  status: string;
  farmer_id: string;
}

export function AllFarmsManagement() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FarmFormData>({
    name: '',
    location: '',
    size_hectares: '',
    latitude: '',
    longitude: '',
    status: 'ACTIVE',
    farmer_id: '',
  });

  useEffect(() => {
    fetchFarms();
    fetchFarmers();
  }, []);

  const fetchFarms = async () => {
    try {
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select(`
          *,
          farmer:farmers(
            id,
            business_name,
            user:users(full_name, email, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (farmsError) throw farmsError;

      const farmsWithCounts = await Promise.all(
        (farmsData || []).map(async (farm) => {
          const [batchesResult, devicesResult] = await Promise.all([
            supabase
              .from('batches')
              .select('id', { count: 'exact', head: true })
              .eq('farm_id', farm.id),
            supabase
              .from('devices')
              .select('id', { count: 'exact', head: true })
              .eq('farm_id', farm.id),
          ]);

          return {
            ...farm,
            batches_count: batchesResult.count || 0,
            devices_count: devicesResult.count || 0,
          };
        })
      );

      setFarms(farmsWithCounts);
    } catch (error: any) {
      console.error('Error fetching farms:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select(`
          id,
          business_name,
          user:users(full_name, email)
        `)
        .eq('verification_status', 'VERIFIED')
        .order('created_at');

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const farmData = {
        name: formData.name,
        location: formData.location,
        size_hectares: formData.size_hectares ? parseFloat(formData.size_hectares) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        status: formData.status,
        farmer_id: formData.farmer_id,
      };

      if (editingFarm) {
        const { error } = await supabase
          .from('farms')
          .update(farmData)
          .eq('id', editingFarm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('farms')
          .insert([farmData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingFarm(null);
      resetForm();
      fetchFarms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this farm? This will also delete all associated batches, devices, and data.')) return;

    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFarms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openEditModal = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      location: farm.location,
      size_hectares: farm.size_hectares?.toString() || '',
      latitude: farm.latitude?.toString() || '',
      longitude: farm.longitude?.toString() || '',
      status: farm.status,
      farmer_id: farm.farmer_id,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      size_hectares: '',
      latitude: '',
      longitude: '',
      status: 'ACTIVE',
      farmer_id: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredFarms = farms.filter((farm) => {
    const matchesSearch =
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmer.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmer.business_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || farm.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: farms.length,
    active: farms.filter((f) => f.status === 'ACTIVE').length,
    inactive: farms.filter((f) => f.status === 'INACTIVE').length,
    maintenance: farms.filter((f) => f.status === 'MAINTENANCE').length,
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
          <h1 className="text-3xl font-bold text-gray-900">All Farms Management</h1>
          <p className="text-gray-600 mt-2">Manage all farms across the platform</p>
        </div>
        <button
          onClick={() => {
            setEditingFarm(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Farm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Farms</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Grid className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Farms</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <Grid className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Farms</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{stats.inactive}</p>
            </div>
            <Grid className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.maintenance}</p>
            </div>
            <Grid className="w-12 h-12 text-yellow-600" />
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
            placeholder="Search farms by name, location, or farmer..."
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
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devices
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
              {filteredFarms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No farms found
                  </td>
                </tr>
              ) : (
                filteredFarms.map((farm) => (
                  <tr key={farm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{farm.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {farm.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {farm.farmer.user.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {farm.farmer.business_name || farm.farmer.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farm.size_hectares ? `${farm.size_hectares} ha` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                        <Grid className="w-4 h-4" />
                        {farm.batches_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                        <Users className="w-4 h-4" />
                        {farm.devices_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          farm.status
                        )}`}
                      >
                        {farm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/farmers/${farm.farmer.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Farmer"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => openEditModal(farm)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit Farm"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(farm.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Farm"
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
                {editingFarm ? 'Edit Farm' : 'Add New Farm'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., Green Valley Poultry Farm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., Mombasa, Kenya"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size (Hectares)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.size_hectares}
                      onChange={(e) => setFormData({ ...formData, size_hectares: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 5.5"
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
                      <option value="INACTIVE">Inactive</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., -4.0435"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 39.6682"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Owner *
                    </label>
                    <select
                      required
                      value={formData.farmer_id}
                      onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select a verified farmer</option>
                      {farmers.map((farmer) => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.user.full_name} {farmer.business_name ? `(${farmer.business_name})` : ''} - {farmer.user.email}
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
                      setEditingFarm(null);
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
                    {editingFarm ? 'Update Farm' : 'Add Farm'}
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
