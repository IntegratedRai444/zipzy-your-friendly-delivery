import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dispute } from '@/hooks/useDisputes';

interface DisputeCardProps {
  dispute: Dispute;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  open: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Open' },
  under_review: { icon: MessageSquare, color: 'bg-blue-100 text-blue-700', label: 'Under Review' },
  resolved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Resolved' },
  closed: { icon: XCircle, color: 'bg-muted text-muted-foreground', label: 'Closed' },
};

const resolutionLabels: Record<string, string> = {
  refund: 'Full Refund Issued',
  partial_refund: 'Partial Refund Issued',
  no_action: 'No Action Taken',
  account_warning: 'Warning Issued',
  account_suspended: 'Account Suspended',
};

export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute }) => {
  const status = statusConfig[dispute.status] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <div className="bg-background rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{dispute.reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {dispute.description || 'No additional details provided'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Raised on {format(new Date(dispute.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <Badge className={`${status.color} gap-1 shrink-0`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
      </div>

      {dispute.status === 'resolved' && dispute.resolution && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm font-medium">Resolution</p>
          <p className="text-sm text-muted-foreground mt-1">
            {resolutionLabels[dispute.resolution] || dispute.resolution}
          </p>
          {dispute.resolution_notes && (
            <p className="text-sm text-muted-foreground mt-1 italic">
              "{dispute.resolution_notes}"
            </p>
          )}
        </div>
      )}

      {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm font-medium mb-2">Evidence ({dispute.evidence_urls.length} files)</p>
          <div className="flex gap-2 overflow-x-auto">
            {dispute.evidence_urls.map((url, index) => (
              <a 
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden"
              >
                <img 
                  src={url} 
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
