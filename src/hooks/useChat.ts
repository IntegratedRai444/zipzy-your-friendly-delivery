import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifyNewMessage } from '@/hooks/useTriggerPushNotification';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

export const useChat = (deliveryRequestId: string | null) => {
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
        .eq('delivery_request_id', deliveryRequestId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [deliveryRequestId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!deliveryRequestId) return;

    const channel = supabase
      .channel(`messages-${deliveryRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `delivery_request_id=eq.${deliveryRequestId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
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
  }, [deliveryRequestId]);

  // Mark messages as read
  useEffect(() => {
    if (!deliveryRequestId || !user) return;

    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('delivery_request_id', deliveryRequestId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    };

    markAsRead();
  }, [deliveryRequestId, user, messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!deliveryRequestId || !user || !content.trim()) return;

      setSending(true);
      const { error } = await supabase.from('messages').insert({
        delivery_request_id: deliveryRequestId,
        sender_id: user.id,
        content: content.trim(),
      });

      // Send push notification to the other party
      if (!error) {
        // Get the delivery to find the other party
        const { data: delivery } = await supabase
          .from('delivery_requests')
          .select('user_id, partner_id')
          .eq('id', deliveryRequestId)
          .single();

        if (delivery) {
          const recipientId = delivery.user_id === user.id 
            ? delivery.partner_id 
            : delivery.user_id;

          if (recipientId) {
            notifyNewMessage(
              recipientId,
              'Your delivery contact',
              content.trim(),
              deliveryRequestId
            );
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
