import React, { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  delivery_request_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

interface ChatMessagesProps {
  deliveryId: string;
  currentUserId: string;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  deliveryId,
  currentUserId
}) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('delivery_request_id', deliveryId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Failed to fetch messages:', error);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`delivery-chat-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `delivery_request_id=eq.${deliveryId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev: Message[]) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <MessageCircle className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
            } mb-4`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === currentUserId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
            >
              <p className="text-sm font-medium mb-1">
                {message.sender_name}
              </p>
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(message.created_at)}
              </p>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
