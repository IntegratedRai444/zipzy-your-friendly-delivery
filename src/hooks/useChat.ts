import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifyNewMessage } from '@/hooks/useTriggerPushNotification';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

export const useChat = (deliveryId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch initial messages
  useEffect(() => {
    if (!deliveryRequestId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('delivery_id', deliveryId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as any[]);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [deliveryId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!deliveryId) return;

    const channel = supabase
      .channel(`messages-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `delivery_id=eq.${deliveryId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  // Mark messages as read
  useEffect(() => {
    if (!deliveryId || !user) return;

    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ is_read: true } as any)
        .eq('delivery_id', deliveryId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    };

    markAsRead();
  }, [deliveryId, user, messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!deliveryId || !user || !content.trim()) return;

      setSending(true);
      const { error } = await supabase.from('messages').insert({
        delivery_id: deliveryId,
        sender_id: user.id,
        message_text: content.trim(),
      } as any);

      // Send push notification to the other party
      if (!error) {
        // Get the delivery to find the other party
        const { data: delivery } = await supabase
          .from('deliveries')
          .select('partner_id, request_id')
          .eq('id', deliveryId)
          .single();

        if (delivery) {
          // Need to get buyer_id from requests table
          const { data: request } = await supabase
            .from('requests')
            .select('buyer_id')
            .eq('id', delivery.request_id)
            .single();

          if (request) {
            const recipientId = request.buyer_id === user.id 
              ? delivery.partner_id 
              : request.buyer_id;

            if (recipientId) {
              notifyNewMessage(
                recipientId,
                'Your delivery contact',
                content.trim(),
                deliveryId
              );
            }
          }
        }
      }

      setSending(false);
      return { error };
    },
    [deliveryRequestId, user]
  );

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.sender_id !== user?.id
  ).length;

  return {
    messages,
    loading,
    sending,
    sendMessage,
    unreadCount,
  };
};
