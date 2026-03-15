import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      // Fetch completed deliveries where user was the partner
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('delivery_requests')
        .select('*')
        .or(`carrier_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (deliveriesError) throw deliveriesError;

      // Fetch ratings for the user
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', user.id);

      if (ratingsError) throw ratingsError;

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      let totalEarnings = 0;
      let pendingEarnings = 0;
      let completedDeliveries = 0;
      let cancelledDeliveries = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      const earningsList: EarningEntry[] = [];

      (deliveries || []).forEach((delivery) => {
        const amount = delivery.estimated_fare || 0;
        const deliveryDate = new Date(delivery.created_at);
        const deliveryMonth = deliveryDate.getMonth();
        const deliveryYear = deliveryDate.getFullYear();

        if (delivery.status === 'delivered') {
          totalEarnings += amount;
          completedDeliveries++;

          if (deliveryMonth === thisMonth && deliveryYear === thisYear) {
            thisMonthEarnings += amount;
          } else if (deliveryMonth === lastMonth && deliveryYear === lastMonthYear) {
            lastMonthEarnings += amount;
          }
        } else if (delivery.status === 'cancelled') {
          cancelledDeliveries++;
        } else if (['matched', 'picked_up', 'in_transit'].includes(delivery.status)) {
          pendingEarnings += amount;
        }

        earningsList.push({
          id: delivery.id,
          delivery_id: delivery.id,
          item_description: delivery.item_description,
          amount,
          status: delivery.status,
          date: delivery.created_at,
          pickup_city: delivery.pickup_city,
          drop_city: delivery.drop_city,
        });
      });

      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      setSummary({
        totalEarnings,
        pendingEarnings,
        completedDeliveries,
        cancelledDeliveries,
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
