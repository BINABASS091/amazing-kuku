import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Search, AlertCircle, Calendar, Activity, Milestone } from 'lucide-react';

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
  is_active: boolean;
  created_at: string;
}

interface BreedStage {
  id: string;
  breed_id: string;
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
  order_index: number;
}

interface BreedMilestone {
  id: string;
  breed_id: string;
  stage_id?: string;
  milestone_day: number;
  milestone_title: string;
  milestone_description: string;
  action_required: string;
  is_critical: boolean;
}

export function BreedConfigurations() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<'list' | 'stages' | 'milestones'>('list');
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null);
  const [editingStage, setEditingStage] = useState<BreedStage | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<BreedMilestone | null>(null);
  const [stages, setStages] = useState<BreedStage[]>([]);
  const [milestones, setMilestones] = useState<BreedMilestone[]>([]);

  const [breedForm, setBreedForm] = useState({
    breed_name: '',
    breed_type: 'MEAT',
    description: '',
    average_maturity_days: '0',
    production_lifespan_days: '0',
    average_weight_kg: '0',
    eggs_per_year: '0',
    feed_consumption_daily_grams: '0',
    space_requirement_sqm: '0',
    temperature_min_celsius: '0',
    temperature_max_celsius: '0',
    humidity_min_percent: '0',
    humidity_max_percent: '0',
    is_active: true,
  });

  const [stageForm, setStageForm] = useState({
    stage_name: '',
    start_day: '0',
    end_day: '0',
    description: '',
    feeding_guide: '',
    health_tips: '',
    housing_requirements: '',
    expected_weight_kg: '0',
    mortality_threshold_percent: '0',
    feed_type: '',
    vaccination_schedule: '',
    common_diseases: '',
    management_practices: '',
    order_index: '0',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    stage_id: '',
    milestone_day: '0',
    milestone_title: '',
    milestone_description: '',
    action_required: '',
    is_critical: false,
  });

  useEffect(() => {
    fetchBreeds();
  }, []);

  useEffect(() => {
    if (selectedBreed) {
      if (view === 'stages') {
        fetchStages(selectedBreed.id);
      } else if (view === 'milestones') {
        fetchMilestones(selectedBreed.id);
      }
    }
  }, [selectedBreed, view]);

  const fetchBreeds = async () => {
    try {
      const { data, error } = await supabase
        .from('breed_configurations')
        .select('*')
        .order('breed_name');

      if (error) throw error;
      setBreeds(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async (breedId: string) => {
    try {
      const { data, error } = await supabase
        .from('breed_stages')
        .select('*')
        .eq('breed_id', breedId)
        .order('order_index');

      if (error) throw error;
      setStages(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchMilestones = async (breedId: string) => {
    try {
      const { data, error } = await supabase
        .from('breed_milestones')
        .select('*')
        .eq('breed_id', breedId)
        .order('milestone_day');

      if (error) throw error;
      setMilestones(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleBreedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const breedData = {
        breed_name: breedForm.breed_name,
        breed_type: breedForm.breed_type,
        description: breedForm.description,
        average_maturity_days: parseInt(breedForm.average_maturity_days),
        production_lifespan_days: parseInt(breedForm.production_lifespan_days),
        average_weight_kg: parseFloat(breedForm.average_weight_kg),
        eggs_per_year: parseInt(breedForm.eggs_per_year),
        feed_consumption_daily_grams: parseFloat(breedForm.feed_consumption_daily_grams),
        space_requirement_sqm: parseFloat(breedForm.space_requirement_sqm),
        temperature_min_celsius: parseFloat(breedForm.temperature_min_celsius),
        temperature_max_celsius: parseFloat(breedForm.temperature_max_celsius),
        humidity_min_percent: parseFloat(breedForm.humidity_min_percent),
        humidity_max_percent: parseFloat(breedForm.humidity_max_percent),
        is_active: breedForm.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingBreed) {
        const { error } = await supabase
          .from('breed_configurations')
          .update(breedData)
          .eq('id', editingBreed.id);

        if (error) throw error;
        setSuccess('Breed updated successfully');
      } else {
        const { error } = await supabase
          .from('breed_configurations')
          .insert([breedData]);

        if (error) throw error;
        setSuccess('Breed created successfully');
      }

      setShowBreedModal(false);
      setEditingBreed(null);
      fetchBreeds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedBreed) return;

    try {
      const stageData = {
        breed_id: selectedBreed.id,
        stage_name: stageForm.stage_name,
        start_day: parseInt(stageForm.start_day),
        end_day: parseInt(stageForm.end_day),
        description: stageForm.description,
        feeding_guide: stageForm.feeding_guide,
        health_tips: stageForm.health_tips,
        housing_requirements: stageForm.housing_requirements,
        expected_weight_kg: parseFloat(stageForm.expected_weight_kg),
        mortality_threshold_percent: parseFloat(stageForm.mortality_threshold_percent),
        feed_type: stageForm.feed_type,
        vaccination_schedule: stageForm.vaccination_schedule,
        common_diseases: stageForm.common_diseases,
        management_practices: stageForm.management_practices,
        order_index: parseInt(stageForm.order_index),
        updated_at: new Date().toISOString(),
      };

      if (editingStage) {
        const { error } = await supabase
          .from('breed_stages')
          .update(stageData)
          .eq('id', editingStage.id);

        if (error) throw error;
        setSuccess('Stage updated successfully');
      } else {
        const { error } = await supabase
          .from('breed_stages')
          .insert([stageData]);

        if (error) throw error;
        setSuccess('Stage created successfully');
      }

      setShowStageModal(false);
      setEditingStage(null);
      fetchStages(selectedBreed.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedBreed) return;

    try {
      const milestoneData = {
        breed_id: selectedBreed.id,
        stage_id: milestoneForm.stage_id || null,
        milestone_day: parseInt(milestoneForm.milestone_day),
        milestone_title: milestoneForm.milestone_title,
        milestone_description: milestoneForm.milestone_description,
        action_required: milestoneForm.action_required,
        is_critical: milestoneForm.is_critical,
        updated_at: new Date().toISOString(),
      };

      if (editingMilestone) {
        const { error } = await supabase
          .from('breed_milestones')
          .update(milestoneData)
          .eq('id', editingMilestone.id);

        if (error) throw error;
        setSuccess('Milestone updated successfully');
      } else {
        const { error } = await supabase
          .from('breed_milestones')
          .insert([milestoneData]);

        if (error) throw error;
        setSuccess('Milestone created successfully');
      }

      setShowMilestoneModal(false);
      setEditingMilestone(null);
      fetchMilestones(selectedBreed.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteBreed = async (id: string) => {
    if (!confirm('Delete this breed? This will also delete all stages and milestones.')) return;

    try {
      const { error } = await supabase
        .from('breed_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Breed deleted successfully');
      fetchBreeds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm('Delete this stage?')) return;

    try {
      const { error } = await supabase
        .from('breed_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Stage deleted successfully');
      if (selectedBreed) fetchStages(selectedBreed.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;

    try {
      const { error } = await supabase
        .from('breed_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Milestone deleted successfully');
      if (selectedBreed) fetchMilestones(selectedBreed.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
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

  const filteredBreeds = breeds.filter((breed) => {
    const matchesSearch = breed.breed_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || breed.breed_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (view === 'stages' && selectedBreed) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => {
              setView('list');
              setSelectedBreed(null);
            }}
            className="text-green-600 hover:text-green-700"
          >
            ← Back to Breeds
          </button>
        </div>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedBreed.breed_name} - Growth Stages
            </h1>
            <p className="text-gray-600 mt-2">Configure farming stages and guidance</p>
          </div>
          <button
            onClick={() => {
              setEditingStage(null);
              setStageForm({
                stage_name: '',
                start_day: '0',
                end_day: '0',
                description: '',
                feeding_guide: '',
                health_tips: '',
                housing_requirements: '',
                expected_weight_kg: '0',
                mortality_threshold_percent: '0',
                feed_type: '',
                vaccination_schedule: '',
                common_diseases: '',
                management_practices: '',
                order_index: stages.length.toString(),
              });
              setShowStageModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Add Stage
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {stages.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No stages configured yet. Add stages to provide farming guidance.
            </div>
          ) : (
            stages.map((stage) => (
              <div key={stage.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{stage.stage_name}</h3>
                    <p className="text-sm text-gray-600">
                      Day {stage.start_day} - {stage.end_day} ({stage.end_day - stage.start_day + 1} days)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingStage(stage);
                        setStageForm({
                          stage_name: stage.stage_name,
                          start_day: stage.start_day.toString(),
                          end_day: stage.end_day.toString(),
                          description: stage.description,
                          feeding_guide: stage.feeding_guide,
                          health_tips: stage.health_tips,
                          housing_requirements: stage.housing_requirements,
                          expected_weight_kg: stage.expected_weight_kg.toString(),
                          mortality_threshold_percent: stage.mortality_threshold_percent.toString(),
                          feed_type: stage.feed_type,
                          vaccination_schedule: stage.vaccination_schedule,
                          common_diseases: stage.common_diseases,
                          management_practices: stage.management_practices,
                          order_index: stage.order_index.toString(),
                        });
                        setShowStageModal(true);
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{stage.description || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Feed Type</h4>
                    <p className="text-gray-700">{stage.feed_type || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Feeding Guide</h4>
                    <p className="text-gray-700">{stage.feeding_guide || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Expected Weight</h4>
                    <p className="text-gray-700">{stage.expected_weight_kg} kg</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Health Tips</h4>
                    <p className="text-gray-700">{stage.health_tips || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Vaccination Schedule</h4>
                    <p className="text-gray-700">{stage.vaccination_schedule || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showStageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingStage ? 'Edit Stage' : 'Add New Stage'}
                </h2>
                <form onSubmit={handleStageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stage Name *</label>
                      <input
                        type="text"
                        required
                        value={stageForm.stage_name}
                        onChange={(e) => setStageForm({ ...stageForm, stage_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g., Chick Stage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Index *</label>
                      <input
                        type="number"
                        required
                        value={stageForm.order_index}
                        onChange={(e) => setStageForm({ ...stageForm, order_index: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Day *</label>
                      <input
                        type="number"
                        required
                        value={stageForm.start_day}
                        onChange={(e) => setStageForm({ ...stageForm, start_day: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Day *</label>
                      <input
                        type="number"
                        required
                        value={stageForm.end_day}
                        onChange={(e) => setStageForm({ ...stageForm, end_day: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={stageForm.description}
                        onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Feed Type</label>
                      <input
                        type="text"
                        value={stageForm.feed_type}
                        onChange={(e) => setStageForm({ ...stageForm, feed_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g., Starter Feed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stageForm.expected_weight_kg}
                        onChange={(e) => setStageForm({ ...stageForm, expected_weight_kg: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Feeding Guide</label>
                      <textarea
                        value={stageForm.feeding_guide}
                        onChange={(e) => setStageForm({ ...stageForm, feeding_guide: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Health Tips</label>
                      <textarea
                        value={stageForm.health_tips}
                        onChange={(e) => setStageForm({ ...stageForm, health_tips: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vaccination Schedule</label>
                      <textarea
                        value={stageForm.vaccination_schedule}
                        onChange={(e) => setStageForm({ ...stageForm, vaccination_schedule: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStageModal(false);
                        setEditingStage(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingStage ? 'Update Stage' : 'Add Stage'}
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

  if (view === 'milestones' && selectedBreed) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => {
              setView('list');
              setSelectedBreed(null);
            }}
            className="text-green-600 hover:text-green-700"
          >
            ← Back to Breeds
          </button>
        </div>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedBreed.breed_name} - Milestones
            </h1>
            <p className="text-gray-600 mt-2">Configure critical milestones and actions</p>
          </div>
          <button
            onClick={() => {
              setEditingMilestone(null);
              setMilestoneForm({
                stage_id: '',
                milestone_day: '0',
                milestone_title: '',
                milestone_description: '',
                action_required: '',
                is_critical: false,
              });
              setShowMilestoneModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Add Milestone
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No milestones configured yet. Add milestones for important farming events.
            </div>
          ) : (
            milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`bg-white rounded-lg border-2 p-6 ${
                  milestone.is_critical ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Day {milestone.milestone_day}</span>
                      {milestone.is_critical && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{milestone.milestone_title}</h3>
                    <p className="text-gray-700 mb-2">{milestone.milestone_description}</p>
                    {milestone.action_required && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Action Required:</p>
                        <p className="text-sm text-blue-800">{milestone.action_required}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setMilestoneForm({
                          stage_id: milestone.stage_id || '',
                          milestone_day: milestone.milestone_day.toString(),
                          milestone_title: milestone.milestone_title,
                          milestone_description: milestone.milestone_description,
                          action_required: milestone.action_required,
                          is_critical: milestone.is_critical,
                        });
                        setShowMilestoneModal(true);
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showMilestoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
                </h2>
                <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Milestone Day *</label>
                      <input
                        type="number"
                        required
                        value={milestoneForm.milestone_day}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_day: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Milestone Title *</label>
                      <input
                        type="text"
                        required
                        value={milestoneForm.milestone_title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g., First Vaccination"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={milestoneForm.milestone_description}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Required</label>
                      <textarea
                        value={milestoneForm.action_required}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, action_required: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_critical"
                        checked={milestoneForm.is_critical}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, is_critical: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="is_critical" className="text-sm font-medium text-gray-700">
                        Mark as Critical Milestone
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMilestoneModal(false);
                        setEditingMilestone(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingMilestone ? 'Update Milestone' : 'Add Milestone'}
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

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Breed Configurations</h1>
          <p className="text-gray-600 mt-2">Manage poultry breeds and farming guidance</p>
        </div>
        <button
          onClick={() => {
            setEditingBreed(null);
            setBreedForm({
              breed_name: '',
              breed_type: 'MEAT',
              description: '',
              average_maturity_days: '0',
              production_lifespan_days: '0',
              average_weight_kg: '0',
              eggs_per_year: '0',
              feed_consumption_daily_grams: '0',
              space_requirement_sqm: '0',
              temperature_min_celsius: '0',
              temperature_max_celsius: '0',
              humidity_min_percent: '0',
              humidity_max_percent: '0',
              is_active: true,
            });
            setShowBreedModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Add Breed
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search breeds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="MEAT">Meat</option>
          <option value="EGG">Egg</option>
          <option value="DUAL_PURPOSE">Dual Purpose</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBreeds.map((breed) => (
          <div key={breed.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{breed.breed_name}</h3>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getBreedTypeBadge(breed.breed_type)}`}>
                  {breed.breed_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingBreed(breed);
                    setBreedForm({
                      breed_name: breed.breed_name,
                      breed_type: breed.breed_type,
                      description: breed.description,
                      average_maturity_days: breed.average_maturity_days.toString(),
                      production_lifespan_days: breed.production_lifespan_days.toString(),
                      average_weight_kg: breed.average_weight_kg.toString(),
                      eggs_per_year: breed.eggs_per_year.toString(),
                      feed_consumption_daily_grams: breed.feed_consumption_daily_grams.toString(),
                      space_requirement_sqm: breed.space_requirement_sqm.toString(),
                      temperature_min_celsius: breed.temperature_min_celsius.toString(),
                      temperature_max_celsius: breed.temperature_max_celsius.toString(),
                      humidity_min_percent: breed.humidity_min_percent.toString(),
                      humidity_max_percent: breed.humidity_max_percent.toString(),
                      is_active: breed.is_active,
                    });
                    setShowBreedModal(true);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteBreed(breed.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4">{breed.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-600">Maturity:</span>
                <span className="ml-2 font-semibold">{breed.average_maturity_days} days</span>
              </div>
              <div>
                <span className="text-gray-600">Weight:</span>
                <span className="ml-2 font-semibold">{breed.average_weight_kg} kg</span>
              </div>
              {breed.eggs_per_year > 0 && (
                <div>
                  <span className="text-gray-600">Eggs/Year:</span>
                  <span className="ml-2 font-semibold">{breed.eggs_per_year}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Feed/Day:</span>
                <span className="ml-2 font-semibold">{breed.feed_consumption_daily_grams}g</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedBreed(breed);
                  setView('stages');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Activity className="w-4 h-4" />
                Manage Stages
              </button>
              <button
                onClick={() => {
                  setSelectedBreed(breed);
                  setView('milestones');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Milestone className="w-4 h-4" />
                Manage Milestones
              </button>
            </div>
          </div>
        ))}
      </div>

      {showBreedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingBreed ? 'Edit Breed' : 'Add New Breed'}
              </h2>
              <form onSubmit={handleBreedSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breed Name *</label>
                    <input
                      type="text"
                      required
                      value={breedForm.breed_name}
                      onChange={(e) => setBreedForm({ ...breedForm, breed_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breed Type *</label>
                    <select
                      required
                      value={breedForm.breed_type}
                      onChange={(e) => setBreedForm({ ...breedForm, breed_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="MEAT">Meat</option>
                      <option value="EGG">Egg</option>
                      <option value="DUAL_PURPOSE">Dual Purpose</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={breedForm.description}
                      onChange={(e) => setBreedForm({ ...breedForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maturity Days</label>
                    <input
                      type="number"
                      value={breedForm.average_maturity_days}
                      onChange={(e) => setBreedForm({ ...breedForm, average_maturity_days: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Production Lifespan (Days)</label>
                    <input
                      type="number"
                      value={breedForm.production_lifespan_days}
                      onChange={(e) => setBreedForm({ ...breedForm, production_lifespan_days: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={breedForm.average_weight_kg}
                      onChange={(e) => setBreedForm({ ...breedForm, average_weight_kg: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Eggs per Year</label>
                    <input
                      type="number"
                      value={breedForm.eggs_per_year}
                      onChange={(e) => setBreedForm({ ...breedForm, eggs_per_year: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Feed (grams)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={breedForm.feed_consumption_daily_grams}
                      onChange={(e) => setBreedForm({ ...breedForm, feed_consumption_daily_grams: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Space Required (sqm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={breedForm.space_requirement_sqm}
                      onChange={(e) => setBreedForm({ ...breedForm, space_requirement_sqm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={breedForm.temperature_min_celsius}
                      onChange={(e) => setBreedForm({ ...breedForm, temperature_min_celsius: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={breedForm.temperature_max_celsius}
                      onChange={(e) => setBreedForm({ ...breedForm, temperature_max_celsius: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Humidity (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={breedForm.humidity_min_percent}
                      onChange={(e) => setBreedForm({ ...breedForm, humidity_min_percent: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Humidity (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={breedForm.humidity_max_percent}
                      onChange={(e) => setBreedForm({ ...breedForm, humidity_max_percent: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={breedForm.is_active}
                      onChange={(e) => setBreedForm({ ...breedForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active (Visible to farmers)
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBreedModal(false);
                      setEditingBreed(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingBreed ? 'Update Breed' : 'Add Breed'}
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
