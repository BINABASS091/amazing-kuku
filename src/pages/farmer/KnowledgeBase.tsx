import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, Search, Lightbulb, Bird, Calendar, AlertTriangle, Activity } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  category: string;
  content: string;
  breed: string | null;
  age_range_days: string | null;
  created_at: string;
}

interface Breed {
  id: string;
  breed_name: string;
  breed_type: string;
  description: string;
  average_maturity_days: number;
  production_lifespan_days: number;
  average_weight_kg: number;
  eggs_per_year: number;
  feed_consumption_daily_grams: number;
  space_requirement_sqm: number;
  temperature_min_celsius: number;
  temperature_max_celsius: number;
  humidity_min_percent: number;
  humidity_max_percent: number;
}

interface BreedStage {
  id: string;
  stage_name: string;
  start_day: number;
  end_day: number;
  description: string;
  feeding_guide: string;
  health_tips: string;
  housing_requirements: string;
  expected_weight_kg: number;
  mortality_threshold_percent: number;
  feed_type: string;
  vaccination_schedule: string;
  common_diseases: string;
  management_practices: string;
}

interface BreedMilestone {
  id: string;
  milestone_day: number;
  milestone_title: string;
  milestone_description: string;
  action_required: string;
  is_critical: boolean;
}

export function KnowledgeBase() {
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'breeds'>('recommendations');
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
  const [breedStages, setBreedStages] = useState<BreedStage[]>([]);
  const [breedMilestones, setBreedMilestones] = useState<BreedMilestone[]>([]);

  useEffect(() => {
    fetchRecommendations();
    fetchBreeds();
  }, []);

  useEffect(() => {
    if (selectedBreed) {
      fetchBreedStages(selectedBreed.id);
      fetchBreedMilestones(selectedBreed.id);
    }
  }, [selectedBreed]);

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

  const fetchBreeds = async () => {
    try {
      const { data, error } = await supabase
        .from('breed_configurations')
        .select('*')
        .eq('is_active', true)
        .order('breed_name');

      if (error) throw error;
      setBreeds(data || []);
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  const fetchBreedStages = async (breedId: string) => {
    try {
      const { data, error } = await supabase
        .from('breed_stages')
        .select('*')
        .eq('breed_id', breedId)
        .order('order_index');

      if (error) throw error;
      setBreedStages(data || []);
    } catch (error) {
      console.error('Error fetching breed stages:', error);
    }
  };

  const fetchBreedMilestones = async (breedId: string) => {
    try {
      const { data, error } = await supabase
        .from('breed_milestones')
        .select('*')
        .eq('breed_id', breedId)
        .order('milestone_day');

      if (error) throw error;
      setBreedMilestones(data || []);
    } catch (error) {
      console.error('Error fetching breed milestones:', error);
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

  const getBreedTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      MEAT: 'bg-red-100 text-red-800',
      EGG: 'bg-yellow-100 text-yellow-800',
      DUAL_PURPOSE: 'bg-blue-100 text-blue-800',
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (selectedBreed) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setSelectedBreed(null)}
            className="text-green-600 hover:text-green-700 mb-4"
          >
            ← Back to Breeds
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{selectedBreed.breed_name} Farming Guide</h1>
          <p className="text-gray-600 mt-2">{selectedBreed.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Breed Type</h3>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getBreedTypeBadge(selectedBreed.breed_type)}`}>
              {selectedBreed.breed_type.replace('_', ' ')}
            </span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Maturity Period</h3>
            <p className="text-2xl font-bold text-gray-900">{selectedBreed.average_maturity_days} days</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Average Weight</h3>
            <p className="text-2xl font-bold text-gray-900">{selectedBreed.average_weight_kg} kg</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Information</h3>
            <div className="space-y-3">
              {selectedBreed.eggs_per_year > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Egg Production (per year):</span>
                  <span className="font-semibold">{selectedBreed.eggs_per_year}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Feed Requirement:</span>
                <span className="font-semibold">{selectedBreed.feed_consumption_daily_grams}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Space per Bird:</span>
                <span className="font-semibold">{selectedBreed.space_requirement_sqm} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Production Lifespan:</span>
                <span className="font-semibold">{selectedBreed.production_lifespan_days} days</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Environmental Requirements</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Temperature Range:</span>
                <span className="font-semibold">{selectedBreed.temperature_min_celsius}°C - {selectedBreed.temperature_max_celsius}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Humidity Range:</span>
                <span className="font-semibold">{selectedBreed.humidity_min_percent}% - {selectedBreed.humidity_max_percent}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Growth Stages</h2>
          {breedStages.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No growth stages configured for this breed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {breedStages.map((stage, index) => (
                <div key={stage.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{stage.stage_name}</h3>
                        <span className="text-sm text-gray-600">
                          Day {stage.start_day} - {stage.end_day}
                        </span>
                      </div>
                      {stage.description && (
                        <p className="text-gray-700 mb-4">{stage.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stage.feed_type && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Feed Type</h4>
                            <p className="text-sm text-gray-700">{stage.feed_type}</p>
                          </div>
                        )}
                        {stage.expected_weight_kg > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Expected Weight</h4>
                            <p className="text-sm text-gray-700">{stage.expected_weight_kg} kg</p>
                          </div>
                        )}
                        {stage.feeding_guide && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-1">Feeding Guide</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{stage.feeding_guide}</p>
                          </div>
                        )}
                        {stage.health_tips && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-1">Health Tips</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{stage.health_tips}</p>
                          </div>
                        )}
                        {stage.vaccination_schedule && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-1">Vaccination Schedule</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{stage.vaccination_schedule}</p>
                          </div>
                        )}
                        {stage.housing_requirements && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-1">Housing Requirements</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{stage.housing_requirements}</p>
                          </div>
                        )}
                        {stage.management_practices && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-1">Management Practices</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{stage.management_practices}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Critical Milestones</h2>
          {breedMilestones.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No milestones configured for this breed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {breedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`rounded-lg border-2 p-6 ${
                    milestone.is_critical
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${
                      milestone.is_critical ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {milestone.is_critical ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Calendar className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900">Day {milestone.milestone_day}</span>
                        {milestone.is_critical && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{milestone.milestone_title}</h3>
                      {milestone.milestone_description && (
                        <p className="text-gray-700 mb-3">{milestone.milestone_description}</p>
                      )}
                      {milestone.action_required && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Action Required:</p>
                          <p className="text-sm text-blue-800 whitespace-pre-wrap">{milestone.action_required}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('knowledge.title')}</h1>
        <p className="text-gray-600 mt-2">{t('knowledge.subtitle')}</p>
      </div>

      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('knowledge.generalRecommendations')}
        </button>
        <button
          onClick={() => setActiveTab('breeds')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'breeds'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('knowledge.breedGuides')}
        </button>
      </div>

      {activeTab === 'recommendations' && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('knowledge.searchPlaceholder')}
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
                <option value="ALL">{t('knowledge.allCategories')}</option>
                <option value="FEEDING">Feeding</option>
                <option value="HEALTH">Health</option>
                <option value="ENVIRONMENT">Environment</option>
                <option value="BIOSECURITY">Biosecurity</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredRecommendations.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">{t('knowledge.noRecommendations')}</p>
              </div>
            ) : (
              filteredRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(
                            recommendation.category
                          )}`}
                        >
                          {recommendation.category}
                        </span>
                        {recommendation.breed && (
                          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            Breed: {recommendation.breed}
                          </span>
                        )}
                        {recommendation.age_range_days && (
                          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            Age: {recommendation.age_range_days} days
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{recommendation.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'breeds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {breeds.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Bird className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No breed guides available yet</p>
            </div>
          ) : (
            breeds.map((breed) => (
              <div
                key={breed.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 transition-all hover:shadow-lg cursor-pointer"
                onClick={() => setSelectedBreed(breed)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Bird className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{breed.breed_name}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getBreedTypeBadge(breed.breed_type)}`}>
                      {breed.breed_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-3">{breed.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maturity:</span>
                    <span className="font-semibold">{breed.average_maturity_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-semibold">{breed.average_weight_kg} kg</span>
                  </div>
                  {breed.eggs_per_year > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eggs/Year:</span>
                      <span className="font-semibold">{breed.eggs_per_year}</span>
                    </div>
                  )}
                </div>

                <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  View Farming Guide
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
