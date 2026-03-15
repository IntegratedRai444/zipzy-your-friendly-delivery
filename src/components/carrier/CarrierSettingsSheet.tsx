import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ItemSize = Database['public']['Enums']['item_size'];
type CarrierAvailability = Database['public']['Tables']['carrier_availability']['Row'];

interface CarrierSettingsSheetProps {
  availability: CarrierAvailability | null;
  onSave: (settings: {
    destinationCity: string;
    destinationAddress: string;
    maxDetourKm: number;
    maxItemSize: ItemSize;
    availableUntil: Date | null;
  }) => void;
  saving?: boolean;
}

export const CarrierSettingsSheet: React.FC<CarrierSettingsSheetProps> = ({
  availability,
  onSave,
  saving,
}) => {
  const [open, setOpen] = useState(false);
  const [destinationCity, setDestinationCity] = useState(availability?.destination_city || '');
  const [destinationAddress, setDestinationAddress] = useState(availability?.destination_address || '');
  const [maxDetourKm, setMaxDetourKm] = useState(Number(availability?.max_detour_km) || 5);
  const [maxItemSize, setMaxItemSize] = useState<ItemSize>(availability?.max_item_size || 'medium');

  const handleSave = () => {
    onSave({
      destinationCity,
      destinationAddress,
      maxDetourKm,
      maxItemSize,
      availableUntil: null,
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-1.5" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Carrier Settings</SheetTitle>
          <SheetDescription>
            Configure your delivery preferences
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="destination-city">Where are you going?</Label>
            <Input
              id="destination-city"
              placeholder="e.g., Mumbai, Delhi"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination-address">Destination Address (Optional)</Label>
            <Input
              id="destination-address"
              placeholder="Specific area or landmark"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Detour Distance</Label>
              <span className="text-sm text-muted-foreground">{maxDetourKm} km</span>
            </div>
            <Slider
              value={[maxDetourKm]}
              onValueChange={([val]) => setMaxDetourKm(val)}
              min={1}
              max={20}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Maximum distance you're willing to go off your route
            </p>
          </div>

          <div className="space-y-2">
            <Label>Maximum Item Size</Label>
            <Select value={maxItemSize} onValueChange={(v) => setMaxItemSize(v as ItemSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (fits in pocket)</SelectItem>
                <SelectItem value="medium">Medium (fits in bag)</SelectItem>
                <SelectItem value="large">Large (needs both hands)</SelectItem>
                <SelectItem value="extra_large">Extra Large (needs vehicle)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={saving || !destinationCity}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
