import React from 'react';
import { Shield, Star, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type TrustScore = Database['public']['Tables']['trust_scores']['Row'];

interface TrustScoreCardProps {
  trustScore: TrustScore | null;
  loading?: boolean;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({
  trustScore,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-background rounded-2xl border border-border p-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
  }

  const score = Number(trustScore?.score ?? 0.5);
  const scorePercent = Math.round(score * 100);
  
  const getTrustLevel = (s: number) => {
    if (s >= 0.8) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' };
    if (s >= 0.6) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' };
    if (s >= 0.4) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950' };
    return { label: 'Building', color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const level = getTrustLevel(score);

  return (
    <div className="bg-background rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${level.bg} flex items-center justify-center`}>
          <Shield className={`w-6 h-6 ${level.color}`} />
        </div>
        <div>
          <h3 className="font-semibold">Trust Score</h3>
          <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-3xl font-bold">{scorePercent}</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
        <div 
          className={`h-full rounded-full transition-all ${
            score >= 0.8 ? 'bg-green-500' : 
            score >= 0.6 ? 'bg-blue-500' : 
            score >= 0.4 ? 'bg-yellow-500' : 'bg-muted-foreground'
          }`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-lg font-semibold">{trustScore?.total_deliveries_completed ?? 0}</p>
        </div>

        <div className="p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Avg Rating</span>
          </div>
          <p className="text-lg font-semibold">
            {trustScore?.avg_rating_as_carrier 
              ? Number(trustScore.avg_rating_as_carrier).toFixed(1) 
              : 'N/A'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">As Carrier</span>
          </div>
          <p className="text-lg font-semibold">{trustScore?.total_as_carrier ?? 0}</p>
        </div>

        <div className="p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cancelled</span>
          </div>
          <p className="text-lg font-semibold">{trustScore?.total_deliveries_cancelled ?? 0}</p>
        </div>
      </div>

      {/* Max Item Value */}
      {trustScore?.max_allowed_item_value && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Max allowed item value: <span className="font-medium text-foreground">₹{trustScore.max_allowed_item_value}</span>
          </p>
        </div>
      )}
    </div>
  );
};
