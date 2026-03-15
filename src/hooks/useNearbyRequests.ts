import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['requests']['Row'];

export const useNearbyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    // Fetch pending requests from the actual 'requests' table
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('status', 'pending')
      .neq('buyer_id', user.id) // Don't show own requests
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime updates on 'requests' table
    const channel = supabase
      .channel('nearby-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: 'status=eq.pending',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
};
