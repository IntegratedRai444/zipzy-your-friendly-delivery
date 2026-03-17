import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, Star, Shield, Package, CheckCircle, 
  Settings as SettingsIcon, IndianRupee, MessageSquare, Award
} from 'lucide-react';
import { useTrustScore } from '@/hooks/useTrustScore';
import { format } from 'date-fns';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { trustScore, loading: trustLoading } = useTrustScore();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    completedDeliveries: 0,
    activeRequests: 0,
    totalSpent: 0,
    totalEarned: 0
  });

  useEffect(() => {
    fetchProfileAndStats();
  }, [user]);

  const fetchProfileAndStats = async () => {
    if (!user) return;
    
    // Fetch Profile from 'users' table
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    setProfile(profileData);

    // Fetch Stats
    // 1. Completed deliveries as partner
    const { count: completedDeliveries } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', user.id)
      .eq('status', 'delivered');

    // 2. Active requests as buyer
    const { count: activeRequests } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id)
      .not('status', 'in', '("delivered","cancelled")');
      
    setStats({
      completedDeliveries: completedDeliveries || 0,
      activeRequests: activeRequests || 0,
      totalSpent: 0,
      totalEarned: 0
    });

    setLoading(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-display font-bold">Identity Profile</h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-4xl space-y-8">
        {/* Profile Card */}
        <div className="bg-background rounded-2xl border border-border p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Award className="w-32 h-32" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <Avatar className="w-32 h-32 border-4 border-muted">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                {profile?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl font-display font-bold">{profile?.name || 'Zipzy User'}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Verified User
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Trust Score</span>
                  <span className={`text-sm font-bold ${
                    Number(trustScore?.score || 0) >= 0.8 ? 'text-green-600' : 
                    Number(trustScore?.score || 0) >= 0.6 ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {(Number(trustScore?.score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                {Number(trustScore?.score || 0) >= 0.8 && (
                  <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Top Rated
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.completedDeliveries}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" /> Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {trustLoading ? '...' : (Number(trustScore?.score || 0) * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" /> Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{format(new Date(user?.created_at || Date.now()), 'MMM yyyy')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges / achievements placeholder */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Early Adopter', icon: Package },
              { label: 'Fast Delivery', icon: Shield },
              { label: 'Great Communicator', icon: MessageSquare },
              { label: 'Campus Hero', icon: Award }
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-6 bg-background border border-border rounded-2xl opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help" title="Keep completing tasks to unlock!">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-center">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
