import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SavedAddress } from '@/hooks/useSavedAddresses';
import { Loader2 } from 'lucide-react';

interface SavedAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: SavedAddress | null;
  onSave: (data: {
    label: string;
    address: string;
    city: string;
    postal_code?: string;
    phone?: string;
    instructions?: string;
    is_default?: boolean;
  }) => Promise<boolean | null>;
}

export const SavedAddressDialog = ({
  open,
  onOpenChange,
  address,
  onSave,
}: SavedAddressDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    instructions: '',
    is_default: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || '',
        address: address.address || '',
        city: address.city || '',
        postal_code: address.postal_code || '',
        phone: address.phone || '',
        instructions: address.instructions || '',
        is_default: address.is_default || false,
      });
    } else {
      setFormData({
        label: '',
        address: '',
        city: '',
        postal_code: '',
        phone: '',
        instructions: '',
        is_default: false,
      });
    }
  }, [address, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await onSave({
      label: formData.label.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      postal_code: formData.postal_code.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      instructions: formData.instructions.trim() || undefined,
      is_default: formData.is_default,
    });

    setSaving(false);

    if (result !== false && result !== null) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {address ? 'Edit Address' : 'Add New Address'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              placeholder="e.g., Home, Office, Mom's Place"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              placeholder="Full address with building/flat number"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                placeholder="PIN Code"
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Contact number for this address"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Delivery Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Ring doorbell twice, leave at gate"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default address
            </Label>
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {address ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
