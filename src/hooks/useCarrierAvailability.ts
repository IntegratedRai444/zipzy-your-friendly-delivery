import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CarrierAvailability = Database['public']['Tables']['partner_locations']['Row'];
type ItemSize = Database['public']['Enums']['item_size'];

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

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const toggleOnline = async () => {
    if (!user) return;
    setUpdating(true);

    try {
      if (availability) {
        const { error } = await supabase
          .from('partner_locations')
          .update({ is_online: !availability.is_online, updated_at: new Date().toISOString() })
          .eq('partner_id', user.id);

        if (error) throw error;
        setAvailability({ ...availability, is_online: !availability.is_online });
        toast({
          title: !availability.is_online ? 'You are now online' : 'You are now offline',
          description: !availability.is_online 
            ? 'You can now receive delivery requests' 
            : 'You will not receive new requests',
        });
      } else {
        // Create initial availability record
        const { data, error } = await supabase
          .from('partner_locations')
          .insert({ partner_id: user.id, is_online: true, latitude: 0, longitude: 0 }) // Lat/Lng are required in types.ts
          .select()
          .single();

        if (error) throw error;
        setAvailability(data);
        toast({
          title: 'You are now online',
          description: 'You can now receive delivery requests',
        });
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
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
      const updateData = {
        max_detour_km: settings.maxDetourKm ?? availability?.max_detour_km,
        updated_at: new Date().toISOString(),
      };

      if (availability) {
        const { error } = await supabase
          .from('partner_locations')
          .update(updateData)
          .eq('partner_id', user.id);

        if (error) throw error;
        setAvailability({ ...availability, ...updateData } as CarrierAvailability);
      } else {
        const { data, error } = await supabase
          .from('partner_locations')
          .insert({ partner_id: user.id, ...updateData, latitude: 0, longitude: 0 })
          .select()
          .single();

        if (error) throw error;
        setAvailability(data);
      }

      toast({
        title: 'Settings updated',
        description: 'Your carrier preferences have been saved',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
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
