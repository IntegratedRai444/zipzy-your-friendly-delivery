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
type CarrierAvailability = Database['public']['Tables']['partner_locations']['Row'];

interface CarrierSettingsSheetProps {
  availability: CarrierAvailability | null;
  onSave: (settings: {
    maxDetourKm: number;
  }) => void;
  saving?: boolean;
}

export const CarrierSettingsSheet: React.FC<CarrierSettingsSheetProps> = ({
  availability,
  onSave,
  saving,
}) => {
  const [open, setOpen] = useState(false);
  const [maxDetourKm, setMaxDetourKm] = useState(Number(availability?.max_detour_km) || 5);

  const handleSave = () => {
    onSave({
      maxDetourKm,
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

          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
