import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyDeliveryStatusChange } from '@/hooks/useTriggerPushNotification';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['delivery_requests']['Row'];
type DeliveryStatus = Database['public']['Enums']['delivery_status'];

export const useCarrierDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .or(`carrier_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching carrier deliveries:', error);
    } else {
      setDeliveries(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('carrier-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
        },
        (payload) => {
          if ((payload.new as DeliveryRequest)?.carrier_id === user?.id) {
            fetchDeliveries();
          }
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
      // Get the delivery first to get sender info
      const { data: delivery } = await supabase
        .from('delivery_requests')
        .select('user_id, item_description')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('delivery_requests')
        .update({
          carrier_id: user.id,
          partner_id: user.id,
          status: 'matched' as DeliveryStatus,
          matched_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending'); // Only accept if still pending

      if (error) throw error;

      // Send push notification to sender
      if (delivery) {
        notifyDeliveryStatusChange(
          delivery.user_id,
          'matched',
          delivery.item_description,
          requestId
        );
      }

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

  const updateStatus = async (requestId: string, status: DeliveryStatus) => {
    if (!user) return false;

    try {
      // Get the delivery first to get sender info
      const { data: delivery } = await supabase
        .from('delivery_requests')
        .select('user_id, item_description')
        .eq('id', requestId)
        .single();

      const updateData: Record<string, unknown> = { status };
      
      if (status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('delivery_requests')
        .update(updateData)
        .eq('id', requestId)
        .or(`carrier_id.eq.${user.id},partner_id.eq.${user.id}`);

      if (error) throw error;

      // Send push notification to sender
      if (delivery) {
        notifyDeliveryStatusChange(
          delivery.user_id,
          status,
          delivery.item_description,
          requestId
        );
      }

      toast({
        title: 'Status updated',
        description: `Delivery marked as ${status.replace('_', ' ')}`,
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

  const activeDeliveries = deliveries.filter(
    d => !['delivered', 'cancelled'].includes(d.status)
  );

  const completedDeliveries = deliveries.filter(
    d => ['delivered', 'cancelled'].includes(d.status)
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
