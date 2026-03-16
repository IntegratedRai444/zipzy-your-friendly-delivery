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
  const [hasAttemptedCreate, setHasAttemptedCreate] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!user) return;

    console.log('[Zipzy] Fetching availability for partner:', user.id);

    const { data, error } = await supabase
      .from('partner_locations')
      .select('*')
      .eq('partner_id', user.id)
      .maybeSingle();

    console.log('[Zipzy] Fetch result:', { data, error });
    if (error) {
      console.error('Error fetching availability:', error);
    } else {
      console.log('[Zipzy] Fetched data:', data);
      // Only update state if we're not in the middle of a toggle
      if (!isToggling) {
        setAvailability(data);
      }
    }
    setLoading(false);
  }, [user, isToggling]);

  // Check if partner_locations row exists, create if it doesn't
  const ensureRowExists = useCallback(async () => {
    if (!user || hasAttemptedCreate) return;

    console.log('[Zipzy] Checking if partner row exists for:', user.id);

    const { data: existingData, error: fetchError } = await supabase
      .from('partner_locations')
      .select('*')
      .eq('partner_id', user.id)
      .maybeSingle();

    console.log('[Zipzy] Existing data check:', { existingData, fetchError });

    if (fetchError) {
      console.error('Error checking existing row:', fetchError);
      // If we can't fetch, try to toggle anyway - maybe row exists but we can't see it
      setHasAttemptedCreate(true);
      return;
    }

    if (!existingData) {
      console.log('[Zipzy] No existing partner row found, trying to create one...');
      setHasAttemptedCreate(true); // Mark that we attempted creation
      
      // Try to create the row, but if it fails due to permissions, we'll handle it in toggle
      try {
        const { data, error } = await supabase
          .from('partner_locations')
          .insert({
            partner_id: user.id,
            location: `POINT(0 0)`, // PostGIS format: POINT(lng lat)
            is_online: false,
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        console.log('[Zipzy] Insert result:', { data, error });

        if (error) {
          console.error('Error creating partner_locations row:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Don't throw error - let toggle handle it
        } else if (data && !availability) {
          console.log('[Zipzy] Successfully created partner row:', data);
          setAvailability(data);
        }
      } catch (insertError) {
        console.error('Exception during insert:', insertError);
        // Continue anyway - maybe toggle will work
      }
    } else {
      console.log('[Zipzy] Partner row already exists:', existingData);
      setHasAttemptedCreate(true);
      if (!availability) {
        setAvailability(existingData);
      }
    }
  }, [user, availability, hasAttemptedCreate]);

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
    setIsToggling(true);

    const newOnlineState = !(availability?.is_online ?? false);

    try {
      console.log('[Zipzy] Toggling online state for partner:', user.id, '→', newOnlineState);

      // Force optimistic update - update UI immediately regardless of database
      console.log('[Zipzy] Forcing optimistic UI update to:', newOnlineState);
      
      // Create a proper availability object that matches the expected schema
      const optimisticData: CarrierAvailability = {
        id: 'temp-id',
        partner_id: user.id,
        is_online: newOnlineState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        accuracy: null,
        heading: null,
        speed: null,
        max_detour_km: null,
        delivery_request_id: null,
        location: null,
      };
      
      console.log('[Zipzy] Setting optimistic data:', optimisticData);
      setAvailability(optimisticData);

      // Use UPDATE instead of UPSERT for toggling online status
      console.log('[Zipzy] Performing UPDATE with data:', {
        is_online: newOnlineState,
        updated_at: new Date().toISOString(),
        partner_id: user.id
      });

      // Try UPDATE without .select() first to avoid 406 errors
      const { error } = await supabase
        .from('partner_locations')
        .update({
          is_online: newOnlineState,
          updated_at: new Date().toISOString(),
        })
        .eq('partner_id', user.id);

      console.log('[Zipzy] UPDATE result (no select):', { error });

      if (error) {
        console.log('[Zipzy] UPDATE failed, trying with SELECT...');
        console.error('UPDATE error:', error);
        
        // If UPDATE fails, try with select
        const { data, error: selectError } = await supabase
          .from('partner_locations')
          .update({
            is_online: newOnlineState,
            updated_at: new Date().toISOString(),
          })
          .eq('partner_id', user.id)
          .select()
          .maybeSingle();

        console.log('[Zipzy] Toggle result (with select):', { data, error: selectError });

        if (selectError) {
          console.error('SELECT error:', selectError);
          throw selectError;
        }
        
        // Update local state with the new status
        if (data) {
          console.log('[Zipzy] Setting availability from SELECT result:', data);
          setAvailability(data);
        } else {
          // If no data returned, fetch fresh data
          console.log('[Zipzy] No data from SELECT, fetching fresh data...');
          setIsToggling(false); // Allow fetch to update state
          await fetchAvailability();
        }
      } else {
        console.log('[Zipzy] UPDATE successful, fetching fresh data...');
        // UPDATE was successful, fetch fresh data to get updated state
        setIsToggling(false); // Allow fetch to update state
        await fetchAvailability();
      }
      
      toast({
        title: newOnlineState ? '✅ You are now Online' : '🔴 You are now Offline',
        description: newOnlineState
          ? 'You can now receive delivery requests'
          : 'You will not receive new requests',
      });
    } catch (error: any) {
      console.error('[Zipzy] Error toggling online status:', error);
      // Revert optimistic update on error
      setIsToggling(false); // Allow fetch to update state
      await fetchAvailability();
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update online status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
      setIsToggling(false);
    }
  };

  const updateSettings = async (settings: Partial<CarrierSettings>) => {
    if (!user) return;
    setUpdating(true);

    try {
      // Use UPDATE instead of UPSERT for updating settings
      const { data, error } = await supabase
        .from('partner_locations')
        .update({
          max_detour_km: settings.maxDetourKm ?? availability?.max_detour_km,
          updated_at: new Date().toISOString(),
        })
        .eq('partner_id', user.id)
        .select()
        .maybeSingle();

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
    isOnline: (() => {
      const online = availability?.is_online ?? false;
      console.log('[Zipzy] isOnline computed value:', online, 'from availability:', availability);
      return online;
    })(),
    toggleOnline,
    updateSettings,
    refetch: fetchAvailability,
  };
};
