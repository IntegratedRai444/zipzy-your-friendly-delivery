import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface TrackingButtonProps {
  tracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export const TrackingButton: React.FC<TrackingButtonProps> = ({
  tracking,
  onStartTracking,
  onStopTracking,
}) => {
  if (tracking) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onStopTracking}
        className="gap-1.5"
      >
        <div className="relative">
          <Navigation className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        Live
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onStartTracking}
      className="gap-1.5"
    >
      <MapPin className="w-4 h-4" />
      Share Location
    </Button>
  );
};
