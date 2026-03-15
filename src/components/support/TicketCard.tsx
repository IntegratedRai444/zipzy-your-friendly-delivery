import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SupportTicket } from '@/hooks/useSupportTickets';

interface TicketCardProps {
  ticket: SupportTicket;
  onClick?: () => void;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  open: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Open' },
  in_progress: { icon: MessageSquare, color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  waiting_response: { icon: AlertCircle, color: 'bg-orange-100 text-orange-700', label: 'Awaiting Response' },
  resolved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Resolved' },
  closed: { icon: CheckCircle, color: 'bg-muted text-muted-foreground', label: 'Closed' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const categoryLabels: Record<string, string> = {
  payment: 'Payment',
  delivery: 'Delivery',
  account: 'Account',
  partner: 'Partner',
  technical: 'Technical',
  other: 'Other',
};

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const status = statusConfig[ticket.status] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <div 
      className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{ticket.subject}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {ticket.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {categoryLabels[ticket.category]}
              </Badge>
              <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(ticket.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        <Badge className={`${status.color} gap-1 shrink-0`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
      </div>
    </div>
  );
};
