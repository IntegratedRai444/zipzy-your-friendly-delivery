import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  delivery_request_id: string | null;
  category: 'payment' | 'delivery' | 'account' | 'partner' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_staff_reply: boolean;
  created_at: string;
}

export interface CreateTicketData {
  category: SupportTicket['category'];
  priority?: SupportTicket['priority'];
  subject: string;
  description: string;
  delivery_request_id?: string;
}

export const useSupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      setTickets((data || []) as SupportTicket[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (ticketData: CreateTicketData) => {
    if (!user) {
      toast.error('Please sign in to create a support ticket');
      return null;
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        ...ticketData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
      return null;
    }

    toast.success('Support ticket created! We\'ll get back to you soon.');
    await fetchTickets();
    return data as SupportTicket;
  };

  const getTicketMessages = async (ticketId: string): Promise<TicketMessage[]> => {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching ticket messages:', error);
      return [];
    }

    return (data || []) as TicketMessage[];
  };

  const sendMessage = async (ticketId: string, content: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        content,
        is_staff_reply: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }

    return data as TicketMessage;
  };

  return {
    tickets,
    loading,
    createTicket,
    getTicketMessages,
    sendMessage,
    refetch: fetchTickets,
  };
};
