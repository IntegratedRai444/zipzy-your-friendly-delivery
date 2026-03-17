import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  ShoppingBag, MapPin, ArrowRight, ArrowLeft, Clock, CheckCircle, 
<<<<<<< HEAD
  IndianRupee, Info, Sparkles, Timer, Calendar, Map, Tag, Loader2,
  Wallet, Banknote, CreditCard
=======
  IndianRupee, Info, Sparkles, Timer, Calendar, Map, Tag, Loader2, Wallet, CreditCard, Globe
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
} from 'lucide-react';
import { z } from 'zod';
import { PromoCodeInput } from '@/components/promo/PromoCodeInput';

// Lazy load the map component
const AddressPickerMap = lazy(() => import('@/components/map/AddressPickerMap').then(m => ({ default: m.AddressPickerMap })));

// Generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Simplified schema for the new flow
const requestSchema = z.object({
  item_description: z.string().min(2, 'Tell us what you want').max(500),
  brand_name: z.string().max(100).optional(),
  model_variant: z.string().max(100).optional(),
  max_budget: z.number().min(1).max(100000).optional(),
  buy_from_area: z.string().max(200).optional(),
  buy_from_shop: z.string().max(200).optional(),
  drop_address: z.string().min(5, 'Delivery address is required'),
  drop_city: z.string().min(2, 'City is required'),
  drop_phone: z.string().min(10, 'Valid phone required'),
  drop_instructions: z.string().max(200).optional(),
  urgency: z.enum(['flexible', 'today', 'scheduled', 'urgent']),
  scheduled_time: z.string().optional(),
<<<<<<< HEAD
  payment_method: z.enum(['cod', 'wallet', 'online']).default('cod'),
=======
  payment_method: z.enum(['wallet', 'cod', 'online']).default('cod'),
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
});

type RequestFormData = z.infer<typeof requestSchema>;

// Partner reward based on estimated item value and urgency
const calculateReward = (budget?: number, urgency?: string) => {
  const baseReward = 50;
  const budgetBonus = budget ? Math.min(Math.round(budget * 0.1), 200) : 30;
  const urgencyMultiplier = urgency === 'today' ? 1.5 : urgency === 'scheduled' ? 1.2 : urgency === 'urgent' ? 2 : 1;
  return Math.round((baseReward + budgetBonus) * urgencyMultiplier);
};

const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Partial<RequestFormData>>({
    urgency: 'flexible',
    payment_method: 'cod',
  });
  
  // Optional field toggles
  const [wantSpecificBrand, setWantSpecificBrand] = useState(false);
  const [wantBudgetLimit, setWantBudgetLimit] = useState(false);
  const [wantSpecificPlace, setWantSpecificPlace] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const handleAISuggest = async () => {
    if (!formData.item_description || formData.item_description.length < 5) {
      toast.info('Please enter a more detailed description for AI to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      const parseRes = await api.post('/requests/parse', { message: formData.item_description });
      if (parseRes.success && parseRes.data) {
        const { item_name, category, brand, is_fragile } = parseRes.data;
        
        // Update fields
        if (brand) {
          setWantSpecificBrand(true);
          updateField('brand_name', brand);
        }

        // Get estimation
        const estimateRes = await api.post('/requests/estimate', { item_name, category });
        if (estimateRes.success && estimateRes.data) {
          const { suggested_price, suggested_reward } = estimateRes.data;
          
          if (suggested_price) {
            setWantBudgetLimit(true);
            updateField('max_budget', suggested_price);
          }
          
          toast.success(`AI suggested a budget of ₹${suggested_price} and reward of ₹${suggested_reward}`);
        }
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      toast.error('AI assistant is currently resting. Please fill in details manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateField = (field: keyof RequestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const partnerReward = calculateReward(formData.max_budget, formData.urgency);
  const platformFee = Math.round(partnerReward * 0.15);
  const subtotal = (formData.max_budget || 0) + partnerReward + platformFee;
  const totalPayable = subtotal - promoDiscount;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.item_description && formData.item_description.length >= 2;
      case 2:
        return true; // Optional fields
      case 3:
        return formData.drop_address && formData.drop_city && formData.drop_phone;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate
      const validated = requestSchema.parse(formData);
      
      setLoading(true);
      
      // Build description with brand info if provided
      let fullDescription = validated.item_description;
      if (wantSpecificBrand && validated.brand_name) {
        fullDescription += ` (Brand: ${validated.brand_name}`;
        if (validated.model_variant) fullDescription += `, ${validated.model_variant}`;
        fullDescription += ')';
      }
      
      // Build pickup info from buy location
      const pickupArea = wantSpecificPlace && validated.buy_from_area 
        ? validated.buy_from_area 
        : 'Partner choice';
      const pickupShop = wantSpecificPlace && validated.buy_from_shop 
        ? validated.buy_from_shop 
        : '';

      await api.post('/requests', {
        item_name: validated.item_description,
        item_description: fullDescription,
        item_size: 'small', // Default for purchase requests
        pickup_address: pickupShop || pickupArea,
        pickup_city: pickupArea,
        drop_address: validated.drop_address,
        drop_city: validated.drop_city,
        drop_notes: validated.drop_instructions || '',
<<<<<<< HEAD
        urgency: validated.urgency || 'flexible',
        reward: partnerReward,
        item_value: validated.max_budget || 0,
        platform_fee: platformFee,
        payment_method: validated.payment_method,
        buyer_id: user?.id,
=======
        urgency: validated.urgency,
        reward: partnerReward,
        item_value: validated.max_budget || 0,
        platform_fee: platformFee,
        buyer_id: user?.id, // Add buyer_id to fix foreign key constraint
        payment_method: validated.payment_method, // Add payment method
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
      });
      
      toast.success("Request created successfully!");
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error('Failed to create request');
        console.error('Request creation error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'What do you want?', icon: ShoppingBag },
    { number: 2, title: 'Preferences', icon: Sparkles },
    { number: 3, title: 'Deliver to', icon: MapPin },
    { number: 4, title: 'Confirm', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-semibold">New Request</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container py-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= s.number 
                    ? 'bg-foreground text-background' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                  step > s.number ? 'bg-foreground' : 'bg-muted'
                }`} />
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
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold mb-2">What do you want?</h2>
                <p className="text-muted-foreground">Tell us what you need, a partner will buy it for you</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Product name or description</Label>
                  <Button
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="h-8 text-primary hover:text-primary/80 gap-1.5"
                    onClick={handleAISuggest}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Magic Suggest
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="e.g., USB-C charger, Milk packet, Paracetamol tablets..."
                  value={formData.item_description || ''}
                  onChange={(e) => updateField('item_description', e.target.value)}
                  className="min-h-[100px] text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Be specific — it helps partners find exactly what you need</p>
              </div>

              {/* Optional: Specific brand */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="wantBrand" 
                    checked={wantSpecificBrand}
                    onCheckedChange={(checked) => setWantSpecificBrand(checked === true)}
                  />
                  <Label htmlFor="wantBrand" className="text-base font-medium cursor-pointer">
                    I want a specific brand
                  </Label>
                </div>
                
                {wantSpecificBrand && (
                  <div className="space-y-4 pl-7 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand name</Label>
                      <Input
                        id="brand"
                        placeholder="e.g., Samsung, Amul, Dolo..."
                        value={formData.brand_name || ''}
                        onChange={(e) => updateField('brand_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant">Model / Variant (optional)</Label>
                      <Input
                        id="variant"
                        placeholder="e.g., 65W, Full cream, 650mg..."
                        value={formData.model_variant || ''}
                        onChange={(e) => updateField('model_variant', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Budget & Location Preferences */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold mb-2">Any preferences?</h2>
                <p className="text-muted-foreground">These are optional — skip if you're flexible</p>
              </div>

              {/* Budget preference */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="wantBudget" 
                    checked={wantBudgetLimit}
                    onCheckedChange={(checked) => setWantBudgetLimit(checked === true)}
                  />
                  <div>
                    <Label htmlFor="wantBudget" className="text-base font-medium cursor-pointer">
                      Set a maximum budget
                    </Label>
                    <p className="text-sm text-muted-foreground">Partner won't spend more than this on the item</p>
                  </div>
                </div>
                
                {wantBudgetLimit && (
                  <div className="pl-7 animate-fade-in">
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="500"
                        value={formData.max_budget || ''}
                        onChange={(e) => updateField('max_budget', parseFloat(e.target.value) || undefined)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Buy-from location preference */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="wantPlace" 
                    checked={wantSpecificPlace}
                    onCheckedChange={(checked) => setWantSpecificPlace(checked === true)}
                  />
                  <div>
                    <Label htmlFor="wantPlace" className="text-base font-medium cursor-pointer">
                      Buy from a specific place
                    </Label>
                    <p className="text-sm text-muted-foreground">Partner will go to this market/area to buy</p>
                  </div>
                </div>
                
                {wantSpecificPlace && (
                  <div className="space-y-4 pl-7 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="area">Market / Area</Label>
                      <Input
                        id="area"
                        placeholder="e.g., Sarojini Nagar, Linking Road..."
                        value={formData.buy_from_area || ''}
                        onChange={(e) => updateField('buy_from_area', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop">Specific shop (optional)</Label>
                      <Input
                        id="shop"
                        placeholder="e.g., Apollo Pharmacy, DMart..."
                        value={formData.buy_from_shop || ''}
                        onChange={(e) => updateField('buy_from_shop', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Urgency/Timing */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <Label className="text-base font-medium">When do you need it?</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
<<<<<<< HEAD
                    { value: 'flexible', label: 'Flexible', icon: Clock, desc: 'Up to 72 hours' },
=======
                    { value: 'flexible', label: 'Flexible', icon: Clock, desc: 'Whenever possible (upto 72 hours)' },
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
                    { value: 'today', label: 'Today', icon: Timer, desc: 'Within hours' },
                    { value: 'scheduled', label: 'Specific time', icon: Calendar, desc: 'Pick a slot' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('urgency', option.value as any)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.urgency === option.value
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mb-2 ${
                        formData.urgency === option.value ? 'text-foreground' : 'text-muted-foreground'
                      }`} />
                      <span className="text-sm font-medium block">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </button>
                  ))}
                </div>
                {formData.urgency === 'flexible' && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Flexible requests are fulfilled faster
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Delivery Location */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold mb-2">Where should we deliver?</h2>
                <p className="text-muted-foreground">Your partner will bring the item here</p>
              </div>

              <div className="space-y-4">
                {/* Map Picker Toggle */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                >
                  <Map className="w-4 h-4 mr-2" />
                  {showMapPicker ? 'Hide Map' : 'Pick location on map'}
                </Button>

                {showMapPicker && (
                  <Suspense fallback={<div className="h-[350px] bg-muted rounded-xl animate-pulse" />}>
                    <AddressPickerMap
                      onLocationSelect={(lat, lng, address) => {
                        if (address) {
                          // Parse address components
                          const parts = address.split(', ');
                          const city = parts.length > 2 ? parts[parts.length - 3] : parts[0];
                          updateField('drop_address', address);
                          updateField('drop_city', city);
                        }
                        setShowMapPicker(false);
                      }}
                      className="h-[350px]"
                    />
                  </Suspense>
                )}

                <div className="space-y-2">
                  <Label htmlFor="drop_address">Delivery address</Label>
                  <Input
                    id="drop_address"
                    placeholder="House/Flat no., Building, Street..."
                    value={formData.drop_address || ''}
                    onChange={(e) => updateField('drop_address', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drop_city">City</Label>
                  <Input
                    id="drop_city"
                    placeholder="e.g., Mumbai, Delhi, Bangalore..."
                    value={formData.drop_city || ''}
                    onChange={(e) => updateField('drop_city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drop_phone">Your phone number</Label>
                  <Input
                    id="drop_phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.drop_phone || ''}
                    onChange={(e) => updateField('drop_phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drop_instructions">Landmark / Instructions (optional)</Label>
                  <Textarea
                    id="drop_instructions"
                    placeholder="Near the park, call when arriving..."
                    value={formData.drop_instructions || ''}
                    onChange={(e) => updateField('drop_instructions', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('payment_method', 'cod')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === 'cod'
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <Wallet className="w-5 h-5 mb-2 text-foreground" />
                      <span className="text-sm font-medium block">Cash on Delivery</span>
                      <span className="text-xs text-muted-foreground">Pay when item arrives</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('payment_method', 'wallet')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === 'wallet'
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mb-2 text-foreground" />
                      <span className="text-sm font-medium block">Wallet Payment</span>
                      <span className="text-xs text-muted-foreground">Pay from wallet balance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('payment_method', 'online')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === 'online'
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <Globe className="w-5 h-5 mb-2 text-foreground" />
                      <span className="text-sm font-medium block">Online Payment</span>
                      <span className="text-xs text-muted-foreground">Pay via UPI/Card</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold mb-2">Confirm your request</h2>
                <p className="text-muted-foreground">A nearby partner already heading this way will purchase and deliver your item</p>
              </div>

              {/* Summary Card */}
              <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
                {/* Item */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{formData.item_description}</p>
                    {wantSpecificBrand && formData.brand_name && (
                      <p className="text-sm text-muted-foreground">
                        Brand: {formData.brand_name} {formData.model_variant && `• ${formData.model_variant}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Budget */}
                {wantBudgetLimit && formData.max_budget && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max item budget</span>
                      <span className="font-medium">₹{formData.max_budget}</span>
                    </div>
                    <div className="h-px bg-border" />
                  </>
                )}

                {/* Buy from */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buy from</p>
                    <p className="font-medium">
                      {wantSpecificPlace && formData.buy_from_area 
                        ? `${formData.buy_from_area}${formData.buy_from_shop ? ` • ${formData.buy_from_shop}` : ''}`
                        : "Partner's choice (any nearby store)"
                      }
                    </p>
                  </div>
                </div>

                {/* Deliver to */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deliver to</p>
                    <p className="font-medium">{formData.drop_address}</p>
                    <p className="text-sm text-muted-foreground">{formData.drop_city}</p>
                  </div>
                </div>

                {/* Timing */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">When</p>
                    <p className="font-medium capitalize">{formData.urgency}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Select Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay partner in cash' },
                    { value: 'wallet', label: 'Zipzy Wallet', icon: Wallet, desc: 'Use your balance' },
                    { value: 'online', label: 'Online Payment', icon: CreditCard, desc: 'UPI / Card' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => updateField('payment_method', method.value as any)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === method.value
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <method.icon className={`w-5 h-5 mb-2 ${
                        formData.payment_method === method.value ? 'text-foreground' : 'text-muted-foreground'
                      }`} />
                      <span className="text-sm font-medium block">{method.label}</span>
                      <span className="text-xs text-muted-foreground">{method.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="p-6 rounded-2xl border-2 border-foreground bg-foreground/5 space-y-4">
                <h3 className="font-semibold">Payment Summary</h3>
                
                {wantBudgetLimit && formData.max_budget && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item cost (max)</span>
                    <span>₹{formData.max_budget}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Partner reward</span>
                  <span>₹{partnerReward}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>₹{platformFee}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo discount</span>
                    <span>-₹{promoDiscount}</span>
                  </div>
                )}
                
                <div className="h-px bg-border" />
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total payable</span>
                  <span className="text-2xl font-bold">
                    ₹{wantBudgetLimit && formData.max_budget ? totalPayable : (partnerReward + platformFee - promoDiscount)}
                    {!wantBudgetLimit && <span className="text-sm font-normal text-muted-foreground"> + item cost</span>}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  {formData.payment_method === 'wallet' 
                    ? 'Payment held securely in escrow until delivery is confirmed'
                    : formData.payment_method === 'cod'
                    ? 'Pay the partner directly in cash upon delivery'
                    : 'Pay securely via online payment gateway'}
                </p>
              </div>

              {/* Promo Code */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Have a promo code?</span>
                </div>
                <PromoCodeInput
                  orderValue={partnerReward + platformFee}
                  onPromoApplied={(discount, promoId) => {
                    setPromoDiscount(discount);
                    setAppliedPromoCode(promoId);
                  }}
                />
              </div>

              {/* Trust message */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-center text-muted-foreground">
                  🛡️ Your payment is protected. Release only after you receive the item.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="container max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleBack}
              className="w-32"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {step < 4 ? (
            <Button 
              size="lg" 
              className="flex-1"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                  Finding Partner...
                </span>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm & Find Partner
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;
