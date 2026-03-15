import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Shield, CreditCard, Bell, 
  Settings as SettingsIcon, Camera, Loader2, Save, ArrowLeft,
  Smartphone, Map, Package, Upload
} from 'lucide-react';
import { useCarrierAvailability } from '@/hooks/useCarrierAvailability';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Account State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: null as string | null,
  });

  // Partner Settings State
  const { availability, updating: partnerUpdating, updateSettings } = useCarrierAvailability();
  
  // Payment Settings State (Mock/Placeholder for now)
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile({
        name: data.name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url,
      });
    }
    setLoading(false);
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);
    if (error) toast.error('Failed to update account');
    else toast.success('Account updated successfully');
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      toast.error('Upload failed');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase.from('users').upsert({ id: user.id, email: user.email!, avatar_url: publicUrl });
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    setUploadingAvatar(false);
    toast.success('Photo updated');
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-display font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="account" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 px-0">Account</TabsTrigger>
            <TabsTrigger value="partner" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 px-0">Partner</TabsTrigger>
            <TabsTrigger value="verification" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 px-0">Verification</TabsTrigger>
            <TabsTrigger value="payment" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 px-0">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Update your personal information and profile photo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{profile.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <button onClick={handleAvatarClick} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                      {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground">JPG, GIF or PNG. Max size 5MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleSaveAccount} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partner Preferences</CardTitle>
                <CardDescription>Manage your delivery radius and preferred areas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Max Detour Distance (km)</Label>
                    <div className="flex items-center gap-4">
                      <Slider 
                        value={[Number(availability?.max_detour_km) || 5]} 
                        onValueChange={([val]) => updateSettings({ maxDetourKm: val })}
                        min={1} max={20} step={1} className="flex-1"
                      />
                      <span className="w-12 text-sm font-medium">{availability?.max_detour_km || 5}km</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>Upload your documents to become a verified partner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Upload Government ID</h3>
                    <p className="text-sm text-muted-foreground">Aadhar, PAN or Driving License</p>
                  </div>
                  <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Select File</Button>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">Status: Pending Verification</p>
                    <p className="text-primary/70">Our team will review your documents within 24 hours.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Configure where you'd like to receive your earnings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input id="upi" placeholder="username@okaxis" value={upiId} onChange={e => setUpiId(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">Bank Details (Account No, IFSC)</Label>
                    <Textarea id="bank" placeholder="Account Number: 1234567890&#10;IFSC: BKID0001234" value={bankDetails} onChange={e => setBankDetails(e.target.value)} />
                  </div>
                </div>
                <Button>Save Payment Details</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
