import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Search, RefreshCw, Users, Crown } from 'lucide-react';

interface FarmerSubscription {
  farmer_id: string;
  farmer_name: string;
  farmer_email: string;
  current_plan: string;
  current_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  amount_paid: number;
  last_updated: string;
  has_active_subscription: boolean;
}

export function SubscriptionsManagement() {
  const [farmerSubscriptions, setFarmerSubscriptions] = useState<FarmerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAllFarmerSubscriptions();
    
    // Set up real-time subscription for subscription changes
    const subscriptionChannel = supabase
      .channel('subscription_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          console.log('Subscription changed, refreshing data...');
          fetchAllFarmerSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, []);

  const fetchAllFarmerSubscriptions = async () => {
    try {
      setLoading(true);
      
      // First, get all farmers
      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select(`
          id,
          user:users(full_name, email, created_at)
        `)
        .order('created_at', { ascending: false });

      if (farmersError) throw farmersError;

      // Then get all subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Combine data to show all farmers with their subscription status
      const farmerSubscriptionData: FarmerSubscription[] = farmers?.map(farmer => {
        // Find the most recent subscription for this farmer
        const farmerSubs = subscriptions?.filter(sub => sub.farmer_id === farmer.id) || [];
        const latestSub = farmerSubs.length > 0 ? farmerSubs[0] : null;
        
        // Determine current plan and status
        let currentPlan = 'FREE';
        let currentStatus = 'ACTIVE';
        let hasActiveSubscription = false;
        
        if (latestSub) {
          // Check if subscription is currently active
          const now = new Date();
          const endDate = latestSub.end_date ? new Date(latestSub.end_date) : null;
          
          if (latestSub.status === 'ACTIVE' && (!endDate || endDate > now)) {
            currentPlan = latestSub.plan_type;
            currentStatus = 'ACTIVE';
            hasActiveSubscription = true;
          } else if (latestSub.status === 'EXPIRED' || (endDate && endDate <= now)) {
            currentPlan = 'FREE'; // Reverted to FREE if expired
            currentStatus = 'EXPIRED';
          } else {
            currentPlan = latestSub.plan_type;
            currentStatus = latestSub.status;
            hasActiveSubscription = latestSub.status === 'ACTIVE';
          }
        }

        return {
          farmer_id: farmer.id,
          farmer_name: farmer.user?.full_name || 'Unknown',
          farmer_email: farmer.user?.email || 'Unknown',
          current_plan: currentPlan,
          current_status: currentStatus,
          subscription_start: latestSub?.start_date || null,
          subscription_end: latestSub?.end_date || null,
          amount_paid: latestSub?.amount || 0,
          last_updated: latestSub?.updated_at || farmer.user?.created_at || new Date().toISOString(),
          has_active_subscription: hasActiveSubscription
        };
      }) || [];

      setFarmerSubscriptions(farmerSubscriptionData);
    } catch (error) {
      console.error('Error fetching farmer subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = farmerSubscriptions.filter((farmer) => {
    const matchesSearch =
      farmer.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.farmer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || farmer.current_status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || farmer.current_plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'PREMIUM':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const stats = {
    totalFarmers: farmerSubscriptions.length,
    freePlan: farmerSubscriptions.filter((f) => f.current_plan === 'FREE').length,
    paidPlans: farmerSubscriptions.filter((f) => f.current_plan !== 'FREE').length,
    activeSubscriptions: farmerSubscriptions.filter((f) => f.has_active_subscription).length,
    totalRevenue: farmerSubscriptions.reduce((sum, f) => sum + (f.amount_paid || 0), 0),
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Farmer Subscriptions</h1>
          <p className="text-gray-600 mt-2">Monitor all farmers and their subscription status (including FREE plans)</p>
        </div>
        <button
          onClick={fetchAllFarmerSubscriptions}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Farmers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalFarmers}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Free Plan</p>
              <p className="text-2xl font-bold text-gray-600 mt-2">{stats.freePlan}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Plans</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.paidPlans}</p>
            </div>
            <Crown className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Subs</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.activeSubscriptions}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by farmer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            All Farmers & Subscription Status ({filteredSubscriptions.length} of {farmerSubscriptions.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time view of all farmers including those on FREE plans
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No farmers found matching the current filters
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((farmer) => (
                  <tr key={farmer.farmer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {farmer.farmer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {farmer.farmer_email}
                        </div>
                        {farmer.has_active_subscription && (
                          <div className="flex items-center mt-1">
                            <Crown className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600">Premium User</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadgeColor(
                          farmer.current_plan
                        )}`}
                      >
                        {farmer.current_plan}
                        {farmer.current_plan === 'FREE' && (
                          <span className="ml-1 text-gray-500">(Default)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          farmer.current_status
                        )}`}
                      >
                        {farmer.current_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.amount_paid > 0 ? (
                        <span className="font-medium text-green-600">
                          ${farmer.amount_paid.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">$0 (FREE)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.subscription_start ? (
                        <div>
                          <div>{formatDate(farmer.subscription_start)}</div>
                          <div className="text-xs text-gray-500">
                            to {formatDate(farmer.subscription_end)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No subscription</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(farmer.last_updated)}
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
