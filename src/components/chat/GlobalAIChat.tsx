import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Minus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const GlobalAIChat: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Zipzy AI Assistant. How can I help you with your campus deliveries today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat/assistant', {
        message: userMessage.content,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response || response.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <Card className="w-[380px] h-[500px] shadow-2xl border-border/50 glass-dark animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-white/10 bg-foreground/5 text-foreground">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Zipzy Assistant</CardTitle>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsMinimized(true)}>
                <Minus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent 
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            ref={scrollRef}
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div 
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" 
                      : "bg-muted text-foreground rounded-tl-none border border-border/50"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
                <Sparkles className="w-3 h-3" />
                <span className="text-xs font-medium">Assistant is thinking...</span>
              </div>
            )}
          </CardContent>

          <div className="p-4 border-t border-white/10 bg-background/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="rounded-xl border-border/50 bg-background focus-visible:ring-primary/30"
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="rounded-xl shadow-lg hover:shadow-primary/20 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Launcher Button / Minimized View */}
      <Button
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group",
          isOpen && !isMinimized ? "bg-primary" : "bg-foreground"
        )}
        onClick={() => {
          if (isMinimized) setIsMinimized(false);
          else setIsOpen(!isOpen);
        }}
      >
        {isOpen && !isMinimized ? (
          <Minus className="w-6 h-6 text-primary-foreground" />
        ) : isMinimized ? (
          <Maximize2 className="w-6 h-6 text-background" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-background group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-foreground"></span>
            </span>
          </div>
        )}
      </Button>
    </div>
  );
};
