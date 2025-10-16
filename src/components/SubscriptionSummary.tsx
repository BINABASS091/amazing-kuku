import React from 'react';
import { Card } from './ui/card';
import { Crown, Zap } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import UsageCounter from './UsageCounter';
import { Link } from 'react-router-dom';

interface SubscriptionSummaryProps {
  totalBirds: number;
  totalBatches: number;
  monthlyPredictions: number;
}

const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({
  totalBirds,
  totalBatches,
  monthlyPredictions,
}) => {
  const { subscription } = useSubscription();
  
  const currentPlan = subscription?.plan_type || 'FREE';
  
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'text-gray-600 bg-gray-100';
      case 'BASIC': return 'text-blue-600 bg-blue-100';
      case 'PREMIUM': return 'text-purple-600 bg-purple-100';
      case 'ENTERPRISE': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Crown className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plan</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(currentPlan)}`}>
                {currentPlan} Plan
              </span>
              {subscription?.status === 'active' ? (
                <span className="text-green-600 text-sm">Active</span>
              ) : (
                <span className="text-gray-600 text-sm">Free</span>
              )}
            </div>
          </div>
        </div>
        
        <Link
          to="/farmer/subscription"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Manage Plan
        </Link>
      </div>

      <div className="space-y-4">
        <UsageCounter
          feature="maxBirds"
          currentUsage={totalBirds}
          label="Birds Tracked"
        />
        
        <UsageCounter
          feature="maxBatches"
          currentUsage={totalBatches}
          label="Active Batches"
        />
        
        <UsageCounter
          feature="maxPredictions"
          currentUsage={monthlyPredictions}
          label="Disease Predictions (This Month)"
        />
      </div>

      {currentPlan === 'FREE' && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Upgrade to unlock more features</span>
          </div>
          <p className="text-sm text-blue-100 mb-3">
            Get unlimited disease predictions, advanced analytics, and more with our Premium plans.
          </p>
          <Link
            to="/farmer/subscription"
            className="inline-flex items-center px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}
    </Card>
  );
};

export default SubscriptionSummary;
