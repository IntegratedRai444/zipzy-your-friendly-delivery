import React from 'react';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { IndianRupee, Package, Clock, MapPin, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PriceBreakdownProps {
  itemSize: 'small' | 'medium' | 'large';
  urgency: 'standard' | 'express' | 'urgent';
  distanceKm?: number;
  showDetails?: boolean;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  itemSize,
  urgency,
  distanceKm = 5,
  showDetails = true,
}) => {
  const { calculatePrice, PLATFORM_FEE_PERCENT } = usePriceCalculator();
  const breakdown = calculatePrice({ itemSize, urgency, distanceKm });

  if (!showDetails) {
    return (
      <div className="flex items-center gap-1.5 text-lg font-semibold">
        <IndianRupee className="w-4 h-4" />
        <span>{breakdown.partnerReward}</span>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Partner reward after {PLATFORM_FEE_PERCENT}% platform fee</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Price Breakdown</span>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>This is an estimated price based on item size, urgency, and distance.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Base fare</span>
          <span>₹{breakdown.baseFare}</span>
        </div>

        {breakdown.sizeFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Size fee ({itemSize})
            </span>
            <span>+₹{breakdown.sizeFee}</span>
          </div>
        )}

        {breakdown.urgencyFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Urgency fee ({urgency})
            </span>
            <span>+₹{breakdown.urgencyFee}</span>
          </div>
        )}

        {breakdown.distanceFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Distance fee (~{distanceKm}km)
            </span>
            <span>+₹{breakdown.distanceFee}</span>
          </div>
        )}

        <div className="border-t border-border pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
            <span className="text-muted-foreground">-₹{breakdown.platformFee}</span>
          </div>
        </div>

        <div className="border-t border-border pt-2 mt-2">
          <div className="flex justify-between items-center font-semibold">
            <span>Partner earns</span>
            <span className="text-green-600">₹{breakdown.partnerReward}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
            <span>You pay</span>
            <span>₹{breakdown.totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
