import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

// System messages start with emoji patterns from our trigger
const SYSTEM_MSG_PREFIXES = ['🤝', '🛍️', '🚗', '✅', '❌', '📸'];

const isSystemMessage = (content: string) =>
  SYSTEM_MSG_PREFIXES.some((prefix) => content.startsWith(prefix));

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const isSystem = isSystemMessage(message.content);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-2 rounded-full bg-muted/60 border border-border">
          <p className="text-xs text-muted-foreground text-center">{message.content}</p>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-0.5">
            {format(new Date(message.created_at), 'h:mm a')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isOwnMessage
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {format(new Date(message.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  );
};
