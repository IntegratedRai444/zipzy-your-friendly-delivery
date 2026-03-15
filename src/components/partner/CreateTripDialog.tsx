import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Calendar, Clock, Package, IndianRupee } from 'lucide-react';
import { usePartnerTrips, CreateTripData } from '@/hooks/usePartnerTrips';

interface CreateTripDialogProps {
  trigger?: React.ReactNode;
}

export const CreateTripDialog: React.FC<CreateTripDialogProps> = ({ trigger }) => {
  const { createTrip } = usePartnerTrips();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTripData>({
    from_city: '',
    to_city: '',
    departure_date: '',
    departure_time: '',
    max_item_size: 'medium',
    max_item_value: 500,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createTrip(formData);
    
    if (result) {
      setOpen(false);
      setFormData({
        from_city: '',
        to_city: '',
        departure_date: '',
        departure_time: '',
        max_item_size: 'medium',
        max_item_value: 500,
        notes: '',
      });
    }
    
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Post a Trip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Post Your Upcoming Trip
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_city">From City</Label>
              <Input
                id="from_city"
                placeholder="e.g., Mumbai"
                value={formData.from_city}
                onChange={(e) => setFormData({ ...formData, from_city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_city">To City</Label>
              <Input
                id="to_city"
                placeholder="e.g., Pune"
                value={formData.to_city}
                onChange={(e) => setFormData({ ...formData, to_city: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_date" className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                id="departure_date"
                type="date"
                min={today}
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure_time" className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Time (Optional)
              </Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time || ''}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                Max Item Size
              </Label>
              <Select
                value={formData.max_item_size}
                onValueChange={(value) => setFormData({ ...formData, max_item_size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (fits in pocket)</SelectItem>
                  <SelectItem value="medium">Medium (fits in bag)</SelectItem>
                  <SelectItem value="large">Large (carry by hand)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_item_value" className="flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4" />
                Max Item Value
              </Label>
              <Input
                id="max_item_value"
                type="number"
                min={100}
                max={10000}
                value={formData.max_item_value}
                onChange={(e) => setFormData({ ...formData, max_item_value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any preferences or restrictions..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Posting...' : 'Post Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
