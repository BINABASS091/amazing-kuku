import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, BookOpen, Trash2 } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  category: string;
  content: string;
  breed: string | null;
  age_range_days: string | null;
  created_at: string;
}

export function RecommendationsManagement() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'FEEDING',
    content: '',
    breed: '',
    age_range_days: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('recommendations').insert({
        title: formData.title,
        category: formData.category,
        content: formData.content,
        breed: formData.breed || null,
        age_range_days: formData.age_range_days || null,
        created_by: user?.id,
      });

      if (error) throw error;

      setFormData({
        title: '',
        category: 'FEEDING',
        content: '',
        breed: '',
        age_range_days: '',
      });
      setShowModal(false);
      fetchRecommendations();
    } catch (error) {
      console.error('Error creating recommendation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    try {
      const { error } = await supabase.from('recommendations').delete().eq('id', id);

      if (error) throw error;
      fetchRecommendations();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || rec.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'FEEDING':
        return 'bg-blue-100 text-blue-800';
      case 'HEALTH':
        return 'bg-green-100 text-green-800';
      case 'ENVIRONMENT':
        return 'bg-orange-100 text-orange-800';
      case 'BIOSECURITY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recommendations Management</h1>
          <p className="text-gray-600 mt-2">Manage best practice recommendations for farmers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Recommendation
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="FEEDING">Feeding</option>
            <option value="HEALTH">Health</option>
            <option value="ENVIRONMENT">Environment</option>
            <option value="BIOSECURITY">Biosecurity</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRecommendations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No recommendations found
          </div>
        ) : (
          filteredRecommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(
                          recommendation.category
                        )}`}
                      >
                        {recommendation.category}
                      </span>
                      {recommendation.breed && (
                        <span className="text-xs text-gray-500">Breed: {recommendation.breed}</span>
                      )}
                      {recommendation.age_range_days && (
                        <span className="text-xs text-gray-500">
                          Age: {recommendation.age_range_days} days
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(recommendation.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed">{recommendation.content}</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Recommendation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="FEEDING">Feeding</option>
                  <option value="HEALTH">Health</option>
                  <option value="ENVIRONMENT">Environment</option>
                  <option value="BIOSECURITY">Biosecurity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breed (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Range Days (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1-7"
                    value={formData.age_range_days}
                    onChange={(e) => setFormData({ ...formData, age_range_days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Recommendation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
