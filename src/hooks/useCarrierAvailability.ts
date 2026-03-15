import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CarrierAvailability = Database['public']['Tables']['carrier_availability']['Row'];
type ItemSize = Database['public']['Enums']['item_size'];

interface CarrierSettings {
  destinationCity: string;
  destinationAddress: string;
  maxDetourKm: number;
  maxItemSize: ItemSize;
  availableUntil: Date | null;
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
      .from('carrier_availability')
      .select('*')
      .eq('user_id', user.id)
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
          .from('carrier_availability')
          .update({ is_online: !availability.is_online, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

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
          .from('carrier_availability')
          .insert({ user_id: user.id, is_online: true })
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

  const updateSettings = async (settings: CarrierSettings) => {
    if (!user) return;
    setUpdating(true);

    try {
      const updateData = {
        destination_city: settings.destinationCity,
        destination_address: settings.destinationAddress,
        max_detour_km: settings.maxDetourKm,
        max_item_size: settings.maxItemSize,
        available_until: settings.availableUntil?.toISOString() || null,
        updated_at: new Date().toISOString(),
      };

      if (availability) {
        const { error } = await supabase
          .from('carrier_availability')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;
        setAvailability({ ...availability, ...updateData } as CarrierAvailability);
      } else {
        const { data, error } = await supabase
          .from('carrier_availability')
          .insert({ user_id: user.id, ...updateData })
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
