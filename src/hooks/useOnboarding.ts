import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingState {
  id?: string;
  completed_at?: string | null;
  skipped_at?: string | null;
  current_step: number;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchOnboarding = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding:', error);
      }

      if (data) {
        setState(data);
        // Show onboarding if not completed or skipped
        setShowOnboarding(!data.completed_at && !data.skipped_at);
      } else {
        // New user, create onboarding record
        const { data: newData, error: insertError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id, current_step: 0 })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating onboarding:', insertError);
        } else {
          setState(newData);
          setShowOnboarding(true);
        }
      }
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  const updateStep = async (step: number) => {
    if (!user) return;

    await supabase
      .from('user_onboarding')
      .update({ current_step: step })
      .eq('user_id', user.id);

    setState(prev => prev ? { ...prev, current_step: step } : null);
  };

  const completeOnboarding = async () => {
    if (!user) return;

    await supabase
      .from('user_onboarding')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', user.id);

    setState(prev => prev ? { ...prev, completed_at: new Date().toISOString() } : null);
    setShowOnboarding(false);
  };

  const skipOnboarding = async () => {
    if (!user) return;

    await supabase
      .from('user_onboarding')
      .update({ skipped_at: new Date().toISOString() })
      .eq('user_id', user.id);

    setState(prev => prev ? { ...prev, skipped_at: new Date().toISOString() } : null);
    setShowOnboarding(false);
  };

  return {
    state,
    loading,
    showOnboarding,
    updateStep,
    completeOnboarding,
    skipOnboarding,
  };
};
