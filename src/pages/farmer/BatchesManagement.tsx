import { useEffect, useState } from 'react';
import { supabase, Batch, Farm } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Package } from 'lucide-react';

interface BatchWithFarm extends Batch {
  farm: Farm;
}

export function BatchesManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchWithFarm[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    farm_id: '',
    batch_number: '',
    breed: '',
    quantity: '',
    start_date: '',
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

      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', farmer.id);

      if (farmsError) throw farmsError;
      setFarms(farmsData || []);

      if (farmsData && farmsData.length > 0) {
        const farmIds = farmsData.map((f) => f.id);

        const { data: batchesData, error: batchesError } = await supabase
          .from('batches')
          .select(`
            *,
            farm:farms(*)
          `)
          .in('farm_id', farmIds)
          .order('created_at', { ascending: false });

        if (batchesError) throw batchesError;
        setBatches(batchesData as any || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('batches').insert({
        farm_id: newBatch.farm_id,
        batch_number: newBatch.batch_number,
        breed: newBatch.breed,
        quantity: parseInt(newBatch.quantity),
        start_date: newBatch.start_date,
        status: 'ACTIVE',
        mortality_count: 0,
        current_age_days: 0,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewBatch({ farm_id: '', batch_number: '', breed: '', quantity: '', start_date: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding batch:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">{t('batches.title')}</h1>
          <p className="text-gray-600 mt-2">{t('batches.subtitle')}</p>
        </div>
        {farms.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Batch
          </button>
        )}
      </div>

      {farms.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">{t('batches.needFarmFirst')}</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No batches registered yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Your First Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{batch.batch_number}</h3>
                    <p className="text-sm text-gray-600">{batch.farm.name}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    batch.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Breed:</span>
                  <span className="font-medium text-gray-900">{batch.breed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">{batch.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium text-gray-900">{batch.current_age_days} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mortality:</span>
                  <span className="font-medium text-gray-900">{batch.mortality_count}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Batch</h2>

            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Farm
                </label>
                <select
                  value={newBatch.farm_id}
                  onChange={(e) => setNewBatch({ ...newBatch, farm_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a farm</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={newBatch.batch_number}
                  onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="e.g., BATCH-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed
                </label>
                <input
                  type="text"
                  value={newBatch.breed}
                  onChange={(e) => setNewBatch({ ...newBatch, breed: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="e.g., Broiler, Kienyeji"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newBatch.quantity}
                  onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Number of birds"
                />
              </div>

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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewBatch({ farm_id: '', batch_number: '', breed: '', quantity: '', start_date: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
