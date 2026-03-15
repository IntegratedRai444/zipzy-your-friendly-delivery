import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  city: string;
  postal_code: string | null;
  phone: string | null;
  instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateAddressData {
  label: string;
  address: string;
  city: string;
  postal_code?: string;
  phone?: string;
  instructions?: string;
  is_default?: boolean;
}

export const useSavedAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching addresses:', error);
        return;
      }

      setAddresses(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = async (addressData: CreateAddressData) => {
    if (!user) return null;

    try {
      // If setting as default, unset other defaults first
      if (addressData.is_default) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          ...addressData,
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to save address');
        return null;
      }

      toast.success('Address saved!');
      await fetchAddresses();
      return data;
    } catch (err) {
      console.error('Error creating address:', err);
      toast.error('Something went wrong');
      return null;
    }
  };

  const updateAddress = async (id: string, updates: Partial<CreateAddressData>) => {
    if (!user) return false;

    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('saved_addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to update address');
        return false;
      }

      toast.success('Address updated!');
      await fetchAddresses();
      return true;
    } catch (err) {
      console.error('Error updating address:', err);
      toast.error('Something went wrong');
      return false;
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to delete address');
        return false;
      }

      toast.success('Address deleted');
      await fetchAddresses();
      return true;
    } catch (err) {
      console.error('Error deleting address:', err);
      toast.error('Something went wrong');
      return false;
    }
  };

  const setAsDefault = async (id: string) => {
    return updateAddress(id, { is_default: true });
  };

  return {
    addresses,
    loading,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefault,
    refetch: fetchAddresses,
  };
};
