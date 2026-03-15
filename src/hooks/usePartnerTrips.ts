import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PartnerTrip {
  id: string;
  partner_id: string;
  from_city: string;
  to_city: string;
  departure_date: string;
  departure_time: string | null;
  max_item_size: string;
  max_item_value: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTripData {
  from_city: string;
  to_city: string;
  departure_date: string;
  departure_time?: string;
  max_item_size?: string;
  max_item_value?: number;
  notes?: string;
}

export const usePartnerTrips = () => {
  const { user } = useAuth();
  const [myTrips, setMyTrips] = useState<PartnerTrip[]>([]);
  const [allTrips, setAllTrips] = useState<PartnerTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTrips = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('partner_trips')
      .select('*')
      .eq('partner_id', user.id)
      .order('departure_date', { ascending: true });

    if (error) {
      console.error('Error fetching my trips:', error);
    } else {
      setMyTrips((data || []) as PartnerTrip[]);
    }
  }, [user]);

  const fetchAllActiveTrips = useCallback(async () => {
    const { data, error } = await supabase
      .from('partner_trips')
      .select('*')
      .eq('is_active', true)
      .gte('departure_date', new Date().toISOString().split('T')[0])
      .order('departure_date', { ascending: true });

    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setAllTrips((data || []) as PartnerTrip[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMyTrips();
    fetchAllActiveTrips();
  }, [fetchMyTrips, fetchAllActiveTrips]);

  const createTrip = async (tripData: CreateTripData) => {
    if (!user) {
      toast.error('Please sign in to create a trip');
      return null;
    }

    const { data, error } = await supabase
      .from('partner_trips')
      .insert({
        partner_id: user.id,
        ...tripData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
      return null;
    }

    toast.success('Trip posted successfully!');
    await fetchMyTrips();
    await fetchAllActiveTrips();
    return data as PartnerTrip;
  };

  const cancelTrip = async (tripId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('partner_trips')
      .update({ is_active: false })
      .eq('id', tripId)
      .eq('partner_id', user.id);

    if (error) {
      console.error('Error canceling trip:', error);
      toast.error('Failed to cancel trip');
      return false;
    }

    toast.success('Trip cancelled');
    await fetchMyTrips();
    await fetchAllActiveTrips();
    return true;
  };

  return {
    myTrips,
    allTrips,
    loading,
    createTrip,
    cancelTrip,
    refetch: () => {
      fetchMyTrips();
      fetchAllActiveTrips();
    },
  };
};
