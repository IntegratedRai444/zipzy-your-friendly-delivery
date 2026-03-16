import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ChatInputProps {
  deliveryId: string;
  currentUserId: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  deliveryId,
  currentUserId
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          delivery_request_id: deliveryId,
          sender_id: currentUserId,
          content: message.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to send message:', error);
      } else {
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !message.trim()}
          size="sm"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
