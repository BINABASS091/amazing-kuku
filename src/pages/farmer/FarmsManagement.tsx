import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Farm } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, MapPin, Calendar, CreditCard as Edit, Trash2 } from 'lucide-react';

export function FarmsManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [newFarm, setNewFarm] = useState({
    name: '',
    location: '',
    size_hectares: '',
  });

  useEffect(() => {
    if (user) {
      fetchFarms();
    }
  }, [user]);

  const fetchFarms = async () => {
    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) return;

      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', farmer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) return;

      const { error } = await supabase.from('farms').insert({
        farmer_id: farmer.id,
        name: newFarm.name,
        location: newFarm.location,
        size_hectares: newFarm.size_hectares ? parseFloat(newFarm.size_hectares) : null,
        status: 'ACTIVE',
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewFarm({ name: '', location: '', size_hectares: '' });
      fetchFarms();
    } catch (error) {
      console.error('Error adding farm:', error);
    }
  };

  const handleEditFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;

    try {
      const { error } = await supabase
        .from('farms')
        .update({
          name: editingFarm.name,
          location: editingFarm.location,
          size_hectares: editingFarm.size_hectares,
        })
        .eq('id', editingFarm.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingFarm(null);
      fetchFarms();
    } catch (error) {
      console.error('Error updating farm:', error);
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm('Are you sure you want to delete this farm? This will also delete all associated batches and data.')) return;

    try {
      const { error } = await supabase.from('farms').delete().eq('id', farmId);

      if (error) throw error;
      fetchFarms();
    } catch (error) {
      console.error('Error deleting farm:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('farms.myFarms')}</h1>
          <p className="text-gray-600 mt-2">{t('farms.subtitleFarmer')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('farms.addFarm')}
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">{t('farms.noFarmsYet')}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('farms.registerFirstFarm')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{farm.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    farm.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {farm.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{farm.location}</span>
                </div>

                {farm.size_hectares && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-sm">Size: {farm.size_hectares} hectares</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">
                    Registered: {new Date(farm.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
                <Link
                  to={`/farmer/farms/${farm.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                >
                  View Details
                </Link>
                <button
                  onClick={() => {
                    setEditingFarm(farm);
                    setShowEditModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Farm</h2>

            <form onSubmit={handleAddFarm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={newFarm.name}
                  onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="e.g., Sunrise Poultry Farm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newFarm.location}
                  onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="e.g., Kiambu County"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (hectares)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newFarm.size_hectares}
                  onChange={(e) => setNewFarm({ ...newFarm, size_hectares: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Optional"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewFarm({ name: '', location: '', size_hectares: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('farms.addFarm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingFarm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Farm</h2>

            <form onSubmit={handleEditFarm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={editingFarm.name}
                  onChange={(e) => setEditingFarm({ ...editingFarm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editingFarm.location}
                  onChange={(e) => setEditingFarm({ ...editingFarm, location: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (hectares)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingFarm.size_hectares || ''}
                  onChange={(e) => setEditingFarm({ ...editingFarm, size_hectares: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFarm(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
