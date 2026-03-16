import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyDeliveryStatusChange } from '@/hooks/useTriggerPushNotification';
import { api } from '@/services/api';
import type { Database } from '@/integrations/supabase/types';

type Delivery = Database['public']['Tables']['deliveries']['Row'] & {
  requests: Database['public']['Tables']['requests']['Row'] | null;
};

export const useCarrierDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('/deliveries/my');
      
      if (response.success) {
        setDeliveries(response.data.deliveries || []);
      } else {
        console.error('Error fetching carrier deliveries:', response.error);
      }
    } catch (error) {
      console.error('Error fetching carrier deliveries:', error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to realtime updates on 'deliveries' table
    const channel = supabase
      .channel('carrier-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `partner_id=eq.${user?.id}`,
        },
        () => {
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDeliveries, user]);

  const acceptRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      await api.post('/deliveries/accept', { request_id: requestId });

      toast({
        title: 'Request accepted!',
        description: 'You can now pick up this delivery',
      });
      fetchDeliveries();
      return true;
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept request. It may have been taken.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateStatus = async (requestId: string, status: Database['public']['Enums']['delivery_status']) => {
    if (!user) return false;

    try {
      // Find delivery record
      const delivery = deliveries.find(d => d.request_id === requestId);
      if (!delivery) throw new Error('Delivery not found');

      await api.patch(`/deliveries/${delivery.id}/status`, { status });

      toast({
        title: 'Status updated',
        description: `Delivery marked as ${status ? status.replace('_', ' ') : ''}`,
      });
      fetchDeliveries();
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Use local filtering for active and completed deliveries
  const activeDeliveries = deliveries.filter(
    d => !['delivered', 'completed', 'cancelled'].includes(d.status || '')
  );

  const completedDeliveries = deliveries.filter(
    d => ['delivered', 'completed', 'cancelled'].includes(d.status || '')
  );

  return {
    deliveries,
    activeDeliveries,
    completedDeliveries,
    loading,
    acceptRequest,
    updateStatus,
    refetch: fetchDeliveries,
  };
};
