import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Search, AlertCircle, Activity, WifiOff, Wifi } from 'lucide-react';

interface Device {
  id: string;
  device_name: string;
  serial_number: string;
  device_type: string;
  status: string;
  farm_id: string;
  batch_id?: string;
  last_online?: string;
  firmware_version?: string;
  installation_date: string;
  notes?: string;
  created_at: string;
  farm?: {
    name: string;
    farmer: {
      user: {
        full_name: string;
      };
    };
  };
  batch?: {
    batch_number: string;
  };
}

interface DeviceFormData {
  device_name: string;
  serial_number: string;
  device_type: string;
  status: string;
  farm_id: string;
  batch_id?: string;
  firmware_version?: string;
  installation_date: string;
  notes?: string;
}

export function DevicesManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<DeviceFormData>({
    device_name: '',
    serial_number: '',
    device_type: 'TEMPERATURE_SENSOR',
    status: 'ACTIVE',
    farm_id: '',
    batch_id: '',
    firmware_version: '',
    installation_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchDevices();
    fetchFarms();
  }, []);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          farm:farms(
            name,
            farmer:farmers(
              user:users(full_name)
            )
          ),
          batch:batches(batch_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const fetchBatches = async (farmId: string) => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, batch_number')
        .eq('farm_id', farmId)
        .order('batch_number');

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const deviceData = {
        ...formData,
        batch_id: formData.batch_id || null,
        firmware_version: formData.firmware_version || null,
        notes: formData.notes || null,
      };

      if (editingDevice) {
        const { error } = await supabase
          .from('devices')
          .update(deviceData)
          .eq('id', editingDevice.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('devices')
          .insert([deviceData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingDevice(null);
      resetForm();
      fetchDevices();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDevices();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_name: device.device_name,
      serial_number: device.serial_number,
      device_type: device.device_type,
      status: device.status,
      farm_id: device.farm_id,
      batch_id: device.batch_id || '',
      firmware_version: device.firmware_version || '',
      installation_date: device.installation_date,
      notes: device.notes || '',
    });
    fetchBatches(device.farm_id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      device_name: '',
      serial_number: '',
      device_type: 'TEMPERATURE_SENSOR',
      status: 'ACTIVE',
      farm_id: '',
      batch_id: '',
      firmware_version: '',
      installation_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setBatches([]);
  };

  const handleFarmChange = (farmId: string) => {
    setFormData({ ...formData, farm_id: farmId, batch_id: '' });
    if (farmId) {
      fetchBatches(farmId);
    } else {
      setBatches([]);
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TEMPERATURE_SENSOR: 'Temperature Sensor',
      HUMIDITY_SENSOR: 'Humidity Sensor',
      FEEDER: 'Feeder',
      WATERER: 'Waterer',
      CAMERA: 'Camera',
      CONTROLLER: 'Controller',
      AIR_QUALITY: 'Air Quality Sensor',
      WEIGHT_SCALE: 'Weight Scale',
      SENSOR: 'Sensor',
      WATER: 'Water System',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      ONLINE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      OFFLINE: 'bg-gray-100 text-gray-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      FAULTY: 'bg-red-100 text-red-800',
      ERROR: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE' || status === 'ONLINE') {
      return <Wifi className="w-4 h-4 text-green-600" />;
    }
    if (status === 'FAULTY' || status === 'ERROR') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    if (status === 'MAINTENANCE') {
      return <Activity className="w-4 h-4 text-yellow-600" />;
    }
    return <WifiOff className="w-4 h-4 text-gray-600" />;
  };

  const filteredDevices = devices.filter((device) =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.farm?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Devices Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage IoT devices across all farms</p>
        </div>
        <button
          onClick={() => {
            setEditingDevice(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Device
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search devices by name, serial number, or farm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firmware
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No devices found
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{device.device_name}</div>
                        <div className="text-sm text-gray-500">{device.serial_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getDeviceTypeLabel(device.device_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{device.farm?.name}</div>
                        <div className="text-sm text-gray-500">
                          {device.farm?.farmer?.user?.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.batch?.batch_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(device.status)}
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                            device.status
                          )}`}
                        >
                          {device.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.firmware_version || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(device)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="text-red-600 hover:text-red-800"
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
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.device_name}
                      onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., Main Barn Temp Sensor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., SN-123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device Type *
                    </label>
                    <select
                      required
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="TEMPERATURE_SENSOR">Temperature Sensor</option>
                      <option value="HUMIDITY_SENSOR">Humidity Sensor</option>
                      <option value="AIR_QUALITY">Air Quality Sensor</option>
                      <option value="WEIGHT_SCALE">Weight Scale</option>
                      <option value="FEEDER">Feeder</option>
                      <option value="WATERER">Waterer</option>
                      <option value="CAMERA">Camera</option>
                      <option value="CONTROLLER">Controller</option>
                      <option value="OTHER">Other</option>
                    </select>
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
                      <option value="FAULTY">Faulty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm *
                    </label>
                    <select
                      required
                      value={formData.farm_id}
                      onChange={(e) => handleFarmChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select a farm</option>
                      {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch (Optional)
                    </label>
                    <select
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      disabled={!formData.farm_id}
                    >
                      <option value="">No specific batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batch_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firmware Version
                    </label>
                    <input
                      type="text"
                      value={formData.firmware_version}
                      onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., v1.2.3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Installation Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.installation_date}
                      onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Additional notes about this device..."
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingDevice(null);
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
                    {editingDevice ? 'Update Device' : 'Add Device'}
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
