import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calendar, Crown, Star, Zap, Check, X } from 'lucide-react';

interface Subscription {
  id: string;
  farmer_id: string;
  plan_type: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  start_date: string;
  end_date: string | null;
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  name: string;
  price: number;
  duration: string;
  description: string;
  features: PlanFeature[];
  icon: React.ComponentType<any>;
  color: string;
  popular?: boolean;
}

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      id: 'FREE',
      name: 'Free Plan',
      price: 0,
      duration: 'Forever',
      description: 'Basic features to get started',
      icon: Star,
      color: 'text-gray-500',
      features: [
        { name: 'Up to 10 birds tracking', included: true },
        { name: 'Basic health monitoring', included: true },
        { name: 'Disease prediction (5/month)', included: true },
        { name: 'Email support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Batch management', included: false },
        { name: 'Financial tracking', included: false },
        { name: 'Priority support', included: false },
      ]
    },
    {
      id: 'BASIC',
      name: 'Basic Plan',
      price: 15,
      duration: 'per month',
      description: 'Perfect for small farms',
      icon: Zap,
      color: 'text-blue-500',
      features: [
        { name: 'Up to 100 birds tracking', included: true },
        { name: 'Advanced health monitoring', included: true },
        { name: 'Disease prediction (50/month)', included: true },
        { name: 'Email & chat support', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Batch management', included: true },
        { name: 'Financial tracking', included: false },
        { name: 'Priority support', included: false },
      ]
    },
    {
      id: 'PREMIUM',
      name: 'Premium Plan',
      price: 35,
      duration: 'per month',
      description: 'Ideal for growing farms',
      icon: Crown,
      color: 'text-purple-500',
      popular: true,
      features: [
        { name: 'Up to 500 birds tracking', included: true },
        { name: 'Advanced health monitoring', included: true },
        { name: 'Unlimited disease predictions', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Batch management', included: true },
        { name: 'Financial tracking', included: true },
        { name: 'Custom reports', included: true },
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise Plan',
      price: 99,
      duration: 'per month',
      description: 'For large commercial operations',
      icon: Crown,
      color: 'text-gold-500',
      features: [
        { name: 'Unlimited birds tracking', included: true },
        { name: 'Advanced health monitoring', included: true },
        { name: 'Unlimited disease predictions', included: true },
        { name: '24/7 dedicated support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Multi-farm management', included: true },
        { name: 'Financial tracking', included: true },
        { name: 'API access', included: true },
      ]
    }
  ];

  useEffect(() => {
    fetchCurrentSubscription();
  }, [user]);

  const fetchCurrentSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('farmer_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCurrentSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    try {
      // In a real implementation, this would integrate with a payment processor
      // For now, we'll just show an alert
      alert(`Upgrade to ${planId} plan - Payment integration coming soon!`);
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Failed to upgrade subscription');
    }
  };

  const getCurrentPlan = () => {
    return currentSubscription?.plan_type || 'FREE';
  };

  const isCurrentPlan = (planId: string) => {
    return getCurrentPlan() === planId;
  };

  const canUpgrade = (planId: string) => {
    const currentPlan = getCurrentPlan();
    const planOrder = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
    return planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = () => {
    if (!currentSubscription?.end_date) return null;
    const endDate = new Date(currentSubscription.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Current Subscription</h2>
          <Calendar className="w-6 h-6 text-gray-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Plan</p>
            <p className="text-xl font-semibold text-blue-600">
              {getCurrentPlan()} Plan
            </p>
          </div>
          
          {currentSubscription?.start_date && (
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="text-lg">{formatDate(currentSubscription.start_date)}</p>
            </div>
          )}
          
          {currentSubscription?.end_date && (
            <div>
              <p className="text-sm text-gray-600">
                {getDaysRemaining() && getDaysRemaining()! > 0 ? 'Days Remaining' : 'Status'}
              </p>
              <p className={`text-lg font-semibold ${
                getDaysRemaining() && getDaysRemaining()! > 0 
                  ? getDaysRemaining()! > 7 ? 'text-green-600' : 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {getDaysRemaining() && getDaysRemaining()! > 0 
                  ? `${getDaysRemaining()} days`
                  : 'Expired'
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = isCurrentPlan(plan.id);
            const canUpgradeToThis = canUpgrade(plan.id);
            
            return (
              <Card key={plan.id} className={`p-6 relative ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              } ${isCurrent ? 'bg-blue-50 border-blue-200' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Icon className={`w-12 h-12 mx-auto mb-4 ${plan.color}`} />
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 ml-1">/{plan.duration}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      )}
                      <span className={feature.included ? '' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || !canUpgradeToThis}
                  className={`w-full ${
                    isCurrent 
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : canUpgradeToThis
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isCurrent 
                    ? 'Current Plan'
                    : canUpgradeToThis
                      ? `Upgrade to ${plan.name}`
                      : 'Contact Sales'
                  }
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Subscription;
