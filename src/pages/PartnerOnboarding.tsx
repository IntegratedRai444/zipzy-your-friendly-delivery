import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Route, MapPin, Phone, Building, ArrowRight, ShieldCheck } from 'lucide-react';

const PartnerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, setIsPartner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    college: '',
    hostel: '',
    radius: '5',
    upi: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Update users table (profile info)
      const { error: userError } = await supabase
        .from('users')
        .update({
          phone: formData.phone,
          city: formData.college,
          address: formData.hostel,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update profiles table too (for Admin compatibility)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          city: formData.college,
          address: formData.hostel,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // 2. Set role to partner in DB (this also updates local state)
      await setIsPartner(true);

      // 3. Initialize partner_locations (replaces carrier_availability)
      const { error: carrierError } = await supabase
        .from('partner_locations')
        .upsert({
          partner_id: user.id,
          max_detour_km: parseFloat(formData.radius),
          is_online: true,
          latitude: 0,
          longitude: 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'partner_id' });

      if (carrierError) throw carrierError;

      toast.success('Partner onboarding completed!');
      navigate('/');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-background rounded-3xl shadow-xl border border-border/50 overflow-hidden">
        <div className="bg-foreground p-8 text-background flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Partner Onboarding</h1>
            <p className="text-background/60 mt-1">Setup your profile to start earning</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi">UPI ID (for payments)</Label>
              <Input
                id="upi"
                name="upi"
                placeholder="username@okaxis"
                value={formData.upi}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College / Campus</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="college"
                  name="college"
                  placeholder="IIT Bombay"
                  value={formData.college}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostel">Hostel / Area</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="hostel"
                  name="hostel"
                  placeholder="Hostel 12, Floor 3"
                  value={formData.hostel}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius">Delivery Radius (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="radius"
                name="radius"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.radius}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground italic">
              * How far are you willing to go from your campus for deliveries?
            </p>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-12 text-lg font-bold group" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background" />
              ) : (
                <>
                  Complete Onboarding
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerOnboarding;
