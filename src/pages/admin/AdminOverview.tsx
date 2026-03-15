import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, Wallet, ShieldCheck, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalUsers: number;
  totalDeliveries: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  pendingVerifications: number;
  totalRevenue: number;
}

export const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts in parallel
        const [
          { count: usersCount },
          { count: deliveriesCount },
          { count: pendingCount },
          { count: completedCount },
          { count: verificationsCount },
          { data: transactions },
          { data: recent }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('delivery_requests').select('*', { count: 'exact', head: true }),
          supabase.from('delivery_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('delivery_requests').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
          supabase.from('user_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('transactions').select('amount').eq('type', 'platform_fee').eq('status', 'completed'),
          supabase.from('delivery_requests').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        const revenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        setStats({
          totalUsers: usersCount || 0,
          totalDeliveries: deliveriesCount || 0,
          pendingDeliveries: pendingCount || 0,
          completedDeliveries: completedCount || 0,
          pendingVerifications: verificationsCount || 0,
          totalRevenue: revenue,
        });
        setRecentDeliveries(recent || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Deliveries', value: stats?.totalDeliveries, icon: Package, color: 'text-green-500' },
    { label: 'Pending', value: stats?.pendingDeliveries, icon: Clock, color: 'text-yellow-500' },
    { label: 'Completed', value: stats?.completedDeliveries, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications, icon: ShieldCheck, color: 'text-orange-500' },
    { label: 'Platform Revenue', value: `₹${stats?.totalRevenue?.toFixed(0) || 0}`, icon: Wallet, color: 'text-purple-500' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDeliveries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No deliveries yet</p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{delivery.item_description}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.pickup_city} → {delivery.drop_city}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    delivery.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                    delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                    delivery.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {delivery.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
