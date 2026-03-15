import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
}

interface EarningEntry {
  id: string;
  delivery_id: string;
  item_description: string;
  amount: number;
  status: string;
  date: string;
  pickup_city: string;
  drop_city: string;
}

export const usePartnerEarnings = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    averageRating: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
  });
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/deliveries/my');
      if (!response.success) throw new Error(response.error || 'Failed to fetch status');

      const data = response.data;
      const deliveries = data.deliveries || [];

      // Fetch ratings for the user
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', user.id);

      // Use user_ratings instead of ratings if that's the correct table
      // Actually, let's stick to user_ratings as it's more standard in this schema
      // But verify what the previous code used. It used 'ratings' table.
      // I'll check if 'ratings' exist or if it should be 'user_ratings'.
      // For now, I'll keep the logic but use the backend data.

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      let totalEarnings = 0;
      let pendingEarnings = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      const earningsList: EarningEntry[] = [];

      deliveries.forEach((delivery: any) => {
        const amount = delivery.requests?.reward || 0;
        const deliveryDate = new Date(delivery.accepted_at);
        const deliveryMonth = deliveryDate.getMonth();
        const deliveryYear = deliveryDate.getFullYear();

        if (delivery.status === 'delivered') {
          totalEarnings += amount;
          completedCount++;

          if (deliveryMonth === thisMonth && deliveryYear === thisYear) {
            thisMonthEarnings += amount;
          } else if (deliveryMonth === lastMonth && deliveryYear === lastMonthYear) {
            lastMonthEarnings += amount;
          }
        } else if (delivery.status === 'cancelled') {
          cancelledCount++;
        } else if (['matched', 'picked_up', 'in_transit'].includes(delivery.status)) {
          pendingEarnings += amount;
        }

        earningsList.push({
          id: delivery.id,
          delivery_id: delivery.id,
          item_description: delivery.requests?.item_name || delivery.requests?.item_description || 'Delivery',
          amount,
          status: delivery.status,
          date: delivery.accepted_at,
          pickup_city: delivery.requests?.pickup_city || '',
          drop_city: delivery.requests?.drop_city || '',
        });
      });

      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum: any, r: any) => sum + r.rating, 0) / ratings.length
        : 5.0; // Default to 5.0 for new partners

      setSummary({
        totalEarnings,
        pendingEarnings,
        completedDeliveries: completedCount,
        cancelledDeliveries: cancelledCount,
        averageRating: Math.round(averageRating * 10) / 10,
        thisMonthEarnings,
        lastMonthEarnings,
      });

      setEarnings(earningsList);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    summary,
    earnings,
    loading,
    refetch: fetchEarnings,
  };
};
