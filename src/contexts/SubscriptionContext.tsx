import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

interface PlanLimits {
  maxBirds: number;
  maxPredictions: number;
  maxBatches: number;
  maxInventoryItems: number;
  hasFinancialTracking: boolean;
  hasAdvancedAnalytics: boolean;
  hasInventoryManagement: boolean;
  hasMultiFarmManagement: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  planLimits: PlanLimits;
  loading: boolean;
  error: string | null;
  checkLimit: (feature: keyof PlanLimits, currentUsage?: number) => boolean;
  refreshSubscription: () => Promise<void>;
  canUpgrade: () => boolean;
  getUpgradeMessage: (feature: string) => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    maxBirds: 10,
    maxPredictions: 5,
    maxBatches: 1,
    maxInventoryItems: 0,
    hasFinancialTracking: false,
    hasAdvancedAnalytics: false,
    hasInventoryManagement: false,
    hasMultiFarmManagement: false,
    hasApiAccess: false,
    hasPrioritySupport: false,
  },
  BASIC: {
    maxBirds: 100,
    maxPredictions: 50,
    maxBatches: 5,
    maxInventoryItems: 50,
    hasFinancialTracking: false,
    hasAdvancedAnalytics: false,
    hasInventoryManagement: true,
    hasMultiFarmManagement: false,
    hasApiAccess: false,
    hasPrioritySupport: false,
  },
  PREMIUM: {
    maxBirds: 500,
    maxPredictions: -1, // unlimited
    maxBatches: 20,
    maxInventoryItems: 200,
    hasFinancialTracking: true,
    hasAdvancedAnalytics: true,
    hasInventoryManagement: true,
    hasMultiFarmManagement: false,
    hasApiAccess: false,
    hasPrioritySupport: true,
  },
  ENTERPRISE: {
    maxBirds: -1, // unlimited
    maxPredictions: -1, // unlimited
    maxBatches: -1, // unlimited
    maxInventoryItems: -1, // unlimited
    hasFinancialTracking: true,
    hasAdvancedAnalytics: true,
    hasInventoryManagement: true,
    hasMultiFarmManagement: true,
    hasApiAccess: true,
    hasPrioritySupport: true,
  },
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPlan = () => {
    return subscription?.plan_type || 'FREE';
  };

  const planLimits = PLAN_LIMITS[getCurrentPlan()];

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('farmer_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      // Check if subscription is expired
      if (data && data.end_date) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        if (endDate < now) {
          // Mark subscription as expired
          await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', data.id);
          
          setSubscription(null);
        } else {
          setSubscription(data);
        }
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = (feature: keyof PlanLimits, currentUsage?: number): boolean => {
    const limit = planLimits[feature];
    
    // For boolean features, return the value directly
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    // For numeric limits, check against current usage
    if (typeof limit === 'number' && currentUsage !== undefined) {
      // -1 means unlimited
      if (limit === -1) return true;
      return currentUsage < limit;
    }
    
    // Default to false if we can't determine
    return false;
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const canUpgrade = (): boolean => {
    const currentPlan = getCurrentPlan();
    return currentPlan !== 'ENTERPRISE';
  };

  const getUpgradeMessage = (feature: string): string => {
    const currentPlan = getCurrentPlan();
    
    switch (currentPlan) {
      case 'FREE':
        return `Upgrade to Basic plan to unlock ${feature}`;
      case 'BASIC':
        return `Upgrade to Premium plan to access ${feature}`;
      case 'PREMIUM':
        return `Upgrade to Enterprise plan for unlimited ${feature}`;
      default:
        return `Upgrade your plan to access ${feature}`;
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    planLimits,
    loading,
    error,
    checkLimit,
    refreshSubscription,
    canUpgrade,
    getUpgradeMessage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
