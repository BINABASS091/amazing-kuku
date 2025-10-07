import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { User, Building2, MapPin, Phone, Award, Save } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    business_name: '',
    location: '',
    phone_number: '',
    experience_years: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      setProfile({
        full_name: user?.full_name || '',
        email: user?.email || '',
        business_name: farmer?.business_name || '',
        location: farmer?.location || '',
        phone_number: farmer?.phone_number || '',
        experience_years: farmer?.experience_years || 0,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      const { error: farmerError } = await supabase
        .from('farmers')
        .update({
          business_name: profile.business_name,
          location: profile.location,
          phone_number: profile.phone_number,
          experience_years: profile.experience_years,
        })
        .eq('user_id', user?.id);

      if (farmerError) throw farmerError;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
        <p className="text-gray-600 mt-2">{t('profile.subtitle')}</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              {t('profile.fullName')}
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              {t('profile.email')}
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">{t('profile.emailNote')}</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              {t('profile.businessName')}
            </label>
            <input
              type="text"
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g., Sunrise Poultry Farm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              {t('profile.location')}
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4" />
              {t('profile.phoneNumber')}
            </label>
            <input
              type="tel"
              value={profile.phone_number}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g., +255 123 456 789"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Award className="w-4 h-4" />
              {t('profile.yearsExperience')}
            </label>
            <input
              type="number"
              min="0"
              value={profile.experience_years}
              onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? t('settings.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
