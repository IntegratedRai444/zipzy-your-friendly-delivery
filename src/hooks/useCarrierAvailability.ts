import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CarrierAvailability = Database['public']['Tables']['partner_locations']['Row'];

interface CarrierSettings {
  maxDetourKm: number;
}

export const useCarrierAvailability = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availability, setAvailability] = useState<CarrierAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('partner_locations')
      .select('*')
      .eq('partner_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching availability:', error);
    } else {
      setAvailability(data);
    }
    setLoading(false);
  }, [user]);

  // Ensure a partner_locations row always exists when this hook loads
  const ensureRowExists = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('partner_locations')
      .upsert(
        {
          partner_id: user.id,
          is_online: false,
          latitude: 0,
          longitude: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'partner_id', ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error ensuring partner_locations row:', error);
    } else if (data && !availability) {
      setAvailability(data);
    }
  }, [user, availability]);

  useEffect(() => {
    const init = async () => {
      await fetchAvailability();
    };
    init();
  }, [fetchAvailability]);

  // After fetch, ensure the row exists (idempotent upsert)
  useEffect(() => {
    if (!loading && user) {
      ensureRowExists();
    }
  }, [loading, user, ensureRowExists]);

  const toggleOnline = async () => {
    if (!user) return;
    setUpdating(true);

    const newOnlineState = !(availability?.is_online ?? false);

    try {
      console.log('[Zipzy] Toggling online state for partner:', user.id, '→', newOnlineState);

      const { data, error } = await supabase
        .from('partner_locations')
        .upsert(
          {
            partner_id: user.id,
            is_online: newOnlineState,
            latitude: availability?.latitude ?? 0,
            longitude: availability?.longitude ?? 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'partner_id' }
        )
        .select()
        .single();

      console.log('[Zipzy] Toggle result:', data, error);

      if (error) throw error;

      setAvailability(data);
      toast({
        title: newOnlineState ? '✅ You are now Online' : '🔴 You are now Offline',
        description: newOnlineState
          ? 'You can now receive delivery requests'
          : 'You will not receive new requests',
      });
    } catch (error: any) {
      console.error('[Zipzy] Error toggling online status:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update online status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateSettings = async (settings: Partial<CarrierSettings>) => {
    if (!user) return;
    setUpdating(true);

    try {
      const { data, error } = await supabase
        .from('partner_locations')
        .upsert(
          {
            partner_id: user.id,
            is_online: availability?.is_online ?? false,
            latitude: availability?.latitude ?? 0,
            longitude: availability?.longitude ?? 0,
            max_detour_km: settings.maxDetourKm ?? (availability as any)?.max_detour_km,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'partner_id' }
        )
        .select()
        .single();

      if (error) throw error;

      setAvailability(data);
      toast({
        title: 'Settings updated',
        description: 'Your carrier preferences have been saved',
      });
    } catch (error: any) {
      console.error('[Zipzy] Error updating settings:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    availability,
    loading,
    updating,
    isOnline: availability?.is_online ?? false,
    toggleOnline,
    updateSettings,
    refetch: fetchAvailability,
  };
};
