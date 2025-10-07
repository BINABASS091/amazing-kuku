import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Farmer, User, Farm } from '../../lib/supabase';
import { ArrowLeft, Warehouse } from 'lucide-react';

interface FarmerWithUser extends Farmer {
  user: User;
}

export function FarmerDetail() {
  const { id } = useParams<{ id: string }>();
  const [farmer, setFarmer] = useState<FarmerWithUser | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchFarmerDetails();
    }
  }, [id]);

  const fetchFarmerDetails = async () => {
    try {
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (farmerError) throw farmerError;
      setFarmer(farmerData as any);

      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', id);

      if (farmsError) throw farmsError;
      setFarms(farmsData || []);
    } catch (error) {
      console.error('Error fetching farmer details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Farmer not found</p>
        <Link to="/admin/farmers" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          Back to Farmers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/farmers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Farmers
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Farmer Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Full Name</p>
            <p className="text-lg font-medium text-gray-900">{farmer.user.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="text-lg font-medium text-gray-900">{farmer.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Business Name</p>
            <p className="text-lg font-medium text-gray-900">{farmer.business_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Location</p>
            <p className="text-lg font-medium text-gray-900">{farmer.location || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Experience</p>
            <p className="text-lg font-medium text-gray-900">{farmer.experience_years} years</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Verification Status</p>
            <span
              className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                farmer.verification_status === 'VERIFIED'
                  ? 'bg-green-100 text-green-800'
                  : farmer.verification_status === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {farmer.verification_status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Farms</h2>
          <span className="text-sm text-gray-600">{farms.length} total</span>
        </div>

        {farms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No farms registered yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <Warehouse className="w-8 h-8 text-green-600" />
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
                <h3 className="font-semibold text-gray-900 mb-2">{farm.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{farm.location}</p>
                {farm.size_hectares && (
                  <p className="text-sm text-gray-600">{farm.size_hectares} hectares</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
