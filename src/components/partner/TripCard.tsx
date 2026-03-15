import React from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, Package, IndianRupee, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartnerTrip } from '@/hooks/usePartnerTrips';
import { useAuth } from '@/contexts/AuthContext';

interface TripCardProps {
  trip: PartnerTrip;
  onCancel?: (tripId: string) => void;
  onContact?: (partnerId: string) => void;
  showActions?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ 
  trip, 
  onCancel, 
  onContact,
  showActions = true,
}) => {
  const { user } = useAuth();
  const isOwner = user?.id === trip.partner_id;
  const departureDate = new Date(trip.departure_date);
  const isToday = departureDate.toDateString() === new Date().toDateString();
  const isTomorrow = departureDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(departureDate, 'MMM d, yyyy');

  return (
    <div className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Route */}
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="truncate">{trip.from_city}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{trip.to_city}</span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{dateLabel}</span>
            </div>
            {trip.departure_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{trip.departure_time.slice(0, 5)}</span>
              </div>
            )}
          </div>

          {/* Constraints */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="gap-1">
              <Package className="w-3 h-3" />
              Max: {trip.max_item_size}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <IndianRupee className="w-3 h-3" />
              Up to ₹{trip.max_item_value}
            </Badge>
          </div>

          {/* Notes */}
          {trip.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {trip.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col gap-2">
            {isOwner ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel?.(trip.id)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onContact?.(trip.partner_id)}
              >
                Request
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
