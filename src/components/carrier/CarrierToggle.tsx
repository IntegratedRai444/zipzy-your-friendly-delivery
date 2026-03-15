import React from 'react';
import { Switch } from '@/components/ui/switch';
import { MapPin, Clock } from 'lucide-react';

interface CarrierToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  updating: boolean;
  destinationCity?: string | null;
}

export const CarrierToggle: React.FC<CarrierToggleProps> = ({
  isOnline,
  onToggle,
  updating,
  destinationCity,
}) => {
  return (
    <div className={`rounded-2xl border p-6 transition-all ${
      isOnline 
        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
        : 'bg-background border-border'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isOnline ? 'bg-green-500' : 'bg-muted'
          }`}>
            <MapPin className={`w-6 h-6 ${isOnline ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-semibold">Carrier Mode</h3>
            <p className="text-sm text-muted-foreground">
              {isOnline 
                ? 'You are accepting deliveries' 
                : 'Go online to accept deliveries'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isOnline && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <Clock className="w-4 h-4" />
              <span>Active</span>
            </div>
          )}
          <Switch
            checked={isOnline}
            onCheckedChange={onToggle}
            disabled={updating}
          />
        </div>
      </div>

      {isOnline && destinationCity && (
        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Destination:</span> {destinationCity}
          </p>
        </div>
      )}
    </div>
  );
};
