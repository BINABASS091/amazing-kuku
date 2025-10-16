import React from 'react';
import { Progress } from './ui/progress';
import { useSubscription } from '../contexts/SubscriptionContext';
import { AlertTriangle, CheckCircle, Crown } from 'lucide-react';

interface UsageCounterProps {
  feature: 'maxBirds' | 'maxPredictions' | 'maxBatches';
  currentUsage: number;
  label: string;
  className?: string;
}

const UsageCounter: React.FC<UsageCounterProps> = ({
  feature,
  currentUsage,
  label,
  className = '',
}) => {
  const { planLimits, getUpgradeMessage } = useSubscription();
  
  const limit = planLimits[feature] as number;
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((currentUsage / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  const getStatusIcon = () => {
    if (isUnlimited) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (isAtLimit) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isNearLimit) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-600';
    if (isNearLimit) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${getStatusColor()}`}>
          {currentUsage} {isUnlimited ? '' : `/ ${limit}`}
          {isUnlimited && <span className="text-yellow-600 ml-1">(Unlimited)</span>}
        </span>
      </div>
      
      {!isUnlimited && (
        <>
          <Progress 
            value={percentage} 
            className="h-2"
            style={{
              '--progress-background': getProgressColor(),
            } as React.CSSProperties}
          />
          
          {isAtLimit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <p className="text-xs text-red-700">
                You've reached your {label.toLowerCase()} limit. {getUpgradeMessage(label)}
              </p>
            </div>
          )}
          
          {isNearLimit && !isAtLimit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <p className="text-xs text-yellow-700">
                You're approaching your {label.toLowerCase()} limit. {getUpgradeMessage(label)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsageCounter;
