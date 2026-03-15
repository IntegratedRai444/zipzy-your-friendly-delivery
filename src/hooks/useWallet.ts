import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Database } from '@/integrations/supabase/types';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('/wallet/summary');
      if (response.success) {
        setWallet(response.data.wallet);
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  }, [user]);

  const creditWallet = async (amount: number) => {
    try {
      await api.post('/wallet/add', { amount });
      await fetchWalletData();
      return true;
    } catch (error) {
      console.error('Error crediting wallet:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchWalletData();
      setLoading(false);
    };

    fetchData();
  }, [fetchWalletData]);

  return {
    wallet,
    transactions,
    loading,
    creditWallet,
    refetch: fetchWalletData,
  };
};