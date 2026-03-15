import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MapPin, Clock, IndianRupee, ArrowRight, Info } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['delivery_requests']['Row'];

const urgencyLabels: Record<string, { label: string; color: string }> = {
  standard: { label: 'Flexible', color: 'bg-muted text-muted-foreground' },
  express: { label: 'Today', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  urgent: { label: 'ASAP', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

interface PartnerRequestCardProps {
  request: DeliveryRequest;
  onAccept: (id: string) => void;
  accepting?: boolean;
}

export const PartnerRequestCard: React.FC<PartnerRequestCardProps> = ({
  request,
  onAccept,
  accepting,
}) => {
  const urgency = urgencyLabels[request.urgency] || urgencyLabels.standard;
  
  // Parse budget from pickup_instructions if available
  const budgetMatch = request.pickup_instructions?.match(/Max budget: ₹(\d+)/);
  const maxBudget = budgetMatch ? parseInt(budgetMatch[1]) : null;

  return (
    <div className="bg-background rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg">{request.item_description}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${urgency.color}`}>
                {urgency.label}
              </span>
              {maxBudget && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-medium">
                  Budget: ₹{maxBudget}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Earnings */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 font-bold text-xl text-green-600">
            <span>+</span>
            <IndianRupee className="w-4 h-4" />
            {request.estimated_fare}
          </div>
          <p className="text-xs text-muted-foreground">You'll earn</p>
        </div>
      </div>

      {/* Route info */}
      <div className="p-4 rounded-xl bg-muted/50 mb-4 space-y-3">
        {/* Buy from */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Buy from</p>
            <p className="font-medium">
              {request.pickup_city === 'Partner choice' 
                ? 'Any nearby store' 
                : request.pickup_city}
            </p>
            {request.pickup_address && request.pickup_address !== request.pickup_city && (
              <p className="text-sm text-muted-foreground">{request.pickup_address}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pl-3">
          <div className="w-px h-4 bg-border" />
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Deliver to */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Deliver to</p>
            <p className="font-medium">{request.drop_city}</p>
            <p className="text-sm text-muted-foreground">{request.drop_address}</p>
          </div>
        </div>
      </div>

      {/* What you need to do */}
      <div className="p-3 rounded-lg bg-foreground/5 border border-border/50 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Your task:</strong> Buy this item 
            {maxBudget ? ` (max ₹${maxBudget})` : ''} and deliver it to the buyer.
            You'll be reimbursed for the item + earn ₹{request.estimated_fare}.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Posted {format(new Date(request.created_at), 'MMM d, h:mm a')}
        </div>
        <Button 
          onClick={() => onAccept(request.id)}
          disabled={accepting}
        >
          {accepting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
              Accepting...
            </span>
          ) : (
            'Accept Task'
          )}
        </Button>
      </div>
    </div>
  );
};
