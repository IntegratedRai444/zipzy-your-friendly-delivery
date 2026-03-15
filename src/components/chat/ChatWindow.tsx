import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  deliveryRequestId: string;
  otherPartyName?: string;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  deliveryRequestId,
  otherPartyName = 'Partner',
  onClose,
}) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useChat(deliveryRequestId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [analyzing, setAnalyzing] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const callAIAssistant = async () => {
    if (!input.trim() || analyzing) return;
    const message = input;
    setInput('');
    setAnalyzing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          message,
          context: { delivery_id: deliveryRequestId }
        })
      });
      const result = await response.json();
      if (result.success) {
        // AI message is usually sent as a 'system' or 'assistant' message which hook should pick up
        // But for UI feedback, we can toast or just wait for message to appear via realtime info
      }
    } catch (err) {
      console.error('AI Assistant failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h3 className="font-semibold">{otherPartyName}</h3>
          <p className="text-xs text-muted-foreground">Delivery Chat</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">No messages yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={callAIAssistant} 
            disabled={!input.trim() || analyzing}
            className="text-primary hover:text-primary/80"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
