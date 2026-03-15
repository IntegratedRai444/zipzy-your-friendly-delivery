import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyDeliveryStatusChange } from '@/hooks/useTriggerPushNotification';
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

    // Fetch deliveries where the partner is assigned, joining with the request details
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        requests (*)
      `)
      .eq('partner_id', user.id)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error fetching carrier deliveries:', error);
    } else {
      setDeliveries((data as any[]) || []);
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
      // Get the request first to get buyer info
      const { data: request } = await supabase
        .from('requests')
        .select('buyer_id, item_description')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      // Create a new delivery record
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          request_id: requestId,
          partner_id: user.id,
          status: 'matched',
          accepted_at: new Date().toISOString(),
        });

      if (deliveryError) throw deliveryError;

      // Update the request status
      const { error: requestError } = await supabase
        .from('requests')
        .update({ status: 'matched' })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (requestError) throw requestError;

      // Send push notification to buyer
      notifyDeliveryStatusChange(
        request.buyer_id || '',
        'matched',
        request.item_description || '',
        requestId
      );

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
      // Find the delivery record
      const delivery = deliveries.find(d => d.request_id === requestId);
      if (!delivery) throw new Error('Delivery not found');

      const updateData: any = { status };
      
      if (status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', delivery.id);

      if (deliveryError) throw deliveryError;

      // Also update the request status for historical tracking
      const { error: requestError } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Send push notification to buyer
      if (delivery.requests) {
        notifyDeliveryStatusChange(
          delivery.requests.buyer_id || '',
          status as any,
          delivery.requests.item_description || '',
          requestId
        );
      }

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

  const activeDeliveries = deliveries.filter(
    d => !['delivered', 'cancelled'].includes(d.status || '')
  );

  const completedDeliveries = deliveries.filter(
    d => ['delivered', 'cancelled'].includes(d.status || '')
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
