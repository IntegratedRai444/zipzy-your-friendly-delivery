import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['requests']['Row'];

export const useNearbyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('/requests/available');
      if (response.success) {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching nearby requests:', error);
    } finally {
      setLoading(false);
    }
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
