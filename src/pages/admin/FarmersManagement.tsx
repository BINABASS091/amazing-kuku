import { useEffect, useState } from 'react';
import { supabase, Farmer, User } from '../../lib/supabase';
import { Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface FarmerWithUser extends Farmer {
  user: User;
}

export function FarmersManagement() {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState<FarmerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select(`
          *,
          users!farmers_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the expected structure
      const transformedData = (data || []).map(farmer => ({
        ...farmer,
        user: farmer.users
      }));
      
      setFarmers(transformedData as any);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyFarmer = async (farmerId: string) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .update({
          verification_status: 'VERIFIED',
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId);

      if (error) throw error;

      alert(t('auth.verifiedSuccess'));
      fetchFarmers();
    } catch (error) {
      console.error('Error verifying farmer:', error);
      alert(t('auth.verifyFailed'));
    }
  };

  const unverifyFarmer = async (farmerId: string) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .update({
          verification_status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId);

      if (error) throw error;

      alert(t('auth.verificationRevoked'));
      fetchFarmers();
    } catch (error) {
      console.error('Error unverifying farmer:', error);
      alert('Failed to revoke verification. Please try again.');
    }
  };

  const filteredFarmers = farmers.filter((farmer) =>
    farmer.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Farmers Management</h1>
        <p className="text-gray-600 mt-2">Manage and verify farmer accounts</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search farmers by name, email, or business..."
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
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
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
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No farmers found
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{farmer.user.full_name}</div>
                        <div className="text-sm text-gray-500">{farmer.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.business_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.user.phone || farmer.phone_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.experience_years} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          farmer.verification_status === 'VERIFIED'
                            ? 'bg-green-100 text-green-800'
                            : farmer.verification_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {farmer.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/farmers/${farmer.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {farmer.verification_status !== 'VERIFIED' ? (
                          <button
                            onClick={() => verifyFarmer(farmer.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Verify Farmer"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => unverifyFarmer(farmer.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Revoke Verification"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
