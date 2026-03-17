import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, MapPin, Phone, ArrowRight, ArrowLeft, Zap, Clock, Truck, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const deliverySchema = z.object({
  item_description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  item_size: z.enum(['small', 'medium', 'large', 'extra_large']),
  item_weight_kg: z.number().min(0.1).max(100).optional(),
  pickup_address: z.string().min(5, 'Address is required'),
  pickup_city: z.string().min(2, 'City is required'),
  pickup_postal_code: z.string().optional(),
  pickup_phone: z.string().min(10, 'Valid phone required'),
  pickup_instructions: z.string().max(200).optional(),
  drop_address: z.string().min(5, 'Address is required'),
  drop_city: z.string().min(2, 'City is required'),
  drop_postal_code: z.string().optional(),
  drop_phone: z.string().min(10, 'Valid phone required'),
  drop_instructions: z.string().max(200).optional(),
  urgency: z.enum(['standard', 'express', 'urgent']),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;



const CreateDelivery: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<DeliveryFormData>>({
    item_size: 'small',
    urgency: 'standard',
  });

  const [priceData, setPriceData] = useState<{ reward: number; platform_fee: number; total_price: number } | null>(null);

  const updateField = (field: keyof DeliveryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const res = await api.post('/requests/estimate', {
        pickup_location: formData.pickup_address || '',
        drop_location: formData.drop_address || '',
        item_size: formData.item_size || 'small',
        urgency: formData.urgency || 'standard',
      });
      if (res.data?.success) {
        setPriceData(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to calculate exact fare');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 3) {
      await fetchEstimate();
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const validated = deliverySchema.parse(formData);
      
      setLoading(true);
      await api.post('/requests', {
        item_name: validated.item_description.split(' ').slice(0, 5).join(' '),
        item_description: validated.item_description,
        item_size: validated.item_size,
        pickup_address: validated.pickup_address,
        pickup_city: validated.pickup_city,
        drop_address: validated.drop_address,
        drop_city: validated.drop_city,
        drop_phone: validated.drop_phone,
        drop_instructions: validated.drop_instructions || null,
        urgency: validated.urgency,
        reward: priceData?.reward || 15,
        item_value: 0,
        platform_fee: priceData?.platform_fee || 3,
        payment_method: 'cod', // Default to COD for delivery requests
      });
      
      toast.success('Delivery request created successfully!');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error('Failed to create delivery request');
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Item Details', icon: Package },
    { number: 2, title: 'Pickup', icon: MapPin },
    { number: 3, title: 'Drop-off', icon: MapPin },
    { number: 4, title: 'Confirm', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-semibold">New Delivery</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container py-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step >= s.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${step >= s.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.number ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="container pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Item Details */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="description">What are you sending?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item (e.g., Documents, Electronics, Clothing)"
                  value={formData.item_description || ''}
                  onChange={(e) => updateField('item_description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Package Size</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['small', 'medium', 'large', 'extra_large'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateField('item_size', size)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.item_size === size
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Package className={`w-6 h-6 mx-auto mb-2 ${formData.item_size === size ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium capitalize">{size.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'standard', label: 'Standard', icon: Clock, desc: '2-3 days' },
                    { value: 'express', label: 'Express', icon: Truck, desc: '1 day' },
                    { value: 'urgent', label: 'Urgent', icon: Zap, desc: 'Same day' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('urgency', option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.urgency === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <option.icon className={`w-6 h-6 mx-auto mb-2 ${formData.urgency === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium block">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pickup Details */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-primary" />
                  Pickup Location
                </h3>
                <p className="text-sm text-muted-foreground">Where should we pick up your package?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_address">Address</Label>
                  <Input
                    id="pickup_address"
                    placeholder="Street address, building, floor"
                    value={formData.pickup_address || ''}
                    onChange={(e) => updateField('pickup_address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_city">City</Label>
                    <Input
                      id="pickup_city"
                      placeholder="City"
                      value={formData.pickup_city || ''}
                      onChange={(e) => updateField('pickup_city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickup_postal">Postal Code</Label>
                    <Input
                      id="pickup_postal"
                      placeholder="Postal code"
                      value={formData.pickup_postal_code || ''}
                      onChange={(e) => updateField('pickup_postal_code', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_phone">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="pickup_phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.pickup_phone || ''}
                      onChange={(e) => updateField('pickup_phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_instructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="pickup_instructions"
                    placeholder="Gate code, landmark, timing preferences..."
                    value={formData.pickup_instructions || ''}
                    onChange={(e) => updateField('pickup_instructions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Drop Details */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-accent/50 border border-accent">
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5" />
                  Drop-off Location
                </h3>
                <p className="text-sm text-muted-foreground">Where should we deliver your package?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drop_address">Address</Label>
                  <Input
                    id="drop_address"
                    placeholder="Street address, building, floor"
                    value={formData.drop_address || ''}
                    onChange={(e) => updateField('drop_address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drop_city">City</Label>
                    <Input
                      id="drop_city"
                      placeholder="City"
                      value={formData.drop_city || ''}
                      onChange={(e) => updateField('drop_city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drop_postal">Postal Code</Label>
                    <Input
                      id="drop_postal"
                      placeholder="Postal code"
                      value={formData.drop_postal_code || ''}
                      onChange={(e) => updateField('drop_postal_code', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drop_phone">Recipient Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="drop_phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.drop_phone || ''}
                      onChange={(e) => updateField('drop_phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drop_instructions">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="drop_instructions"
                    placeholder="Leave at door, call on arrival..."
                    value={formData.drop_instructions || ''}
                    onChange={(e) => updateField('drop_instructions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Package</p>
                      <p className="text-sm text-muted-foreground">{formData.item_description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{formData.item_size?.replace('_', ' ')} • {formData.urgency}</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-border" />
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Pickup</p>
                      <p className="text-sm text-muted-foreground">{formData.pickup_address}</p>
                      <p className="text-sm text-muted-foreground">{formData.pickup_city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-background" />
                    </div>
                    <div>
                      <p className="font-medium">Drop-off</p>
                      <p className="text-sm text-muted-foreground">{formData.drop_address}</p>
                      <p className="text-sm text-muted-foreground">{formData.drop_city}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border-2 border-primary bg-primary/5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Delivery Reward</span>
                    <span>₹{priceData?.reward || 15}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border/50">
                    <span>Platform Fee (20%)</span>
                    <span>₹{priceData?.platform_fee || 3}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="font-semibold text-foreground">Total Fare</p>
                      <p className="text-xs text-primary">Pay on delivery</p>
                    </div>
                    <p className="text-3xl font-bold">₹{priceData?.total_price || 18}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="container max-w-2xl mx-auto flex gap-4">
          {step > 1 && (
            <Button variant="outline" size="lg" className="flex-1" onClick={handleBack}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button size="lg" className="flex-1" onClick={handleNext}>
              Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  Confirm & Find Partner
                  <CheckCircle className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateDelivery;
