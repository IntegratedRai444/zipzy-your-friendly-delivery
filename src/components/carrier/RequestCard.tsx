import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Clock, IndianRupee, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['delivery_requests']['Row'];

const urgencyLabels: Record<string, { label: string; color: string }> = {
  standard: { label: 'Standard', color: 'bg-muted text-muted-foreground' },
  express: { label: 'Express', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

const sizeLabels: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  extra_large: 'Extra Large',
};

interface RequestCardProps {
  request: DeliveryRequest;
  onAccept: (id: string) => void;
  accepting?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  accepting,
}) => {
  const urgency = urgencyLabels[request.urgency] || urgencyLabels.standard;

  return (
    <div className="bg-background rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{request.item_description}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${urgency.color}`}>
                {urgency.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {sizeLabels[request.item_size] || request.item_size}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 font-semibold text-lg">
            <IndianRupee className="w-4 h-4" />
            {request.estimated_fare}
          </div>
          <p className="text-xs text-muted-foreground">Est. fare</p>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-4 h-4 text-green-500" />
          <span className="truncate max-w-[100px]">{request.pickup_city}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="truncate max-w-[100px]">{request.drop_city}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {format(new Date(request.created_at), 'MMM d, h:mm a')}
        </div>
        <Button 
          size="sm" 
          onClick={() => onAccept(request.id)}
          disabled={accepting}
        >
          Accept Delivery
        </Button>
      </div>
    </div>
  );
};
