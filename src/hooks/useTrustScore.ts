import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type TrustScore = Database['public']['Tables']['trust_scores']['Row'];

export const useTrustScore = () => {
  const { user } = useAuth();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrustScore = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching trust score:', error);
    } else {
      setTrustScore(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTrustScore();
  }, [fetchTrustScore]);

  const getTrustLevel = (score: number): { label: string; color: string } => {
    if (score >= 0.8) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 0.6) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 0.4) return { label: 'Average', color: 'text-yellow-600' };
    return { label: 'Building Trust', color: 'text-muted-foreground' };
  };

  return { 
    trustScore, 
    loading, 
    refetch: fetchTrustScore,
    getTrustLevel: trustScore ? getTrustLevel(Number(trustScore.score)) : { label: 'New User', color: 'text-muted-foreground' },
  };
};
