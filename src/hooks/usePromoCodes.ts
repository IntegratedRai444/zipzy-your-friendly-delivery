import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount: number | null;
  min_order_value: number;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface ApplyPromoResult {
  success: boolean;
  discount: number;
  promoCode?: PromoCode;
  error?: string;
}

export const usePromoCodes = () => {
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discount, setDiscount] = useState(0);

  const validatePromoCode = async (code: string, orderValue: number): Promise<ApplyPromoResult> => {
    if (!user) {
      return { success: false, discount: 0, error: 'Please sign in to use promo codes' };
    }

    setApplying(true);

    try {
      // Fetch the promo code
      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching promo:', error);
        return { success: false, discount: 0, error: 'Failed to validate code' };
      }

      if (!promo) {
        return { success: false, discount: 0, error: 'Invalid promo code' };
      }

      // Check if expired
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        return { success: false, discount: 0, error: 'This promo code has expired' };
      }

      // Check usage limit
      if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
        return { success: false, discount: 0, error: 'This promo code has reached its usage limit' };
      }

      // Check minimum order value
      if (orderValue < promo.min_order_value) {
        return { 
          success: false, 
          discount: 0, 
          error: `Minimum order value is ₹${promo.min_order_value}` 
        };
      }

      // Check if user already used this promo
      const { data: usage } = await supabase
        .from('promo_usage')
        .select('id')
        .eq('user_id', user.id)
        .eq('promo_code_id', promo.id)
        .maybeSingle();

      if (usage) {
        return { success: false, discount: 0, error: 'You have already used this promo code' };
      }

      // Calculate discount
      let discountAmount = 0;
      if (promo.discount_type === 'percentage') {
        discountAmount = (orderValue * promo.discount_value) / 100;
        if (promo.max_discount) {
          discountAmount = Math.min(discountAmount, promo.max_discount);
        }
      } else {
        discountAmount = promo.discount_value;
      }

      // Ensure discount doesn't exceed order value
      discountAmount = Math.min(discountAmount, orderValue);

      setAppliedPromo(promo as PromoCode);
      setDiscount(discountAmount);

      return { 
        success: true, 
        discount: discountAmount, 
        promoCode: promo as PromoCode 
      };
    } catch (err) {
      console.error('Error validating promo:', err);
      return { success: false, discount: 0, error: 'Something went wrong' };
    } finally {
      setApplying(false);
    }
  };

  const applyPromoCode = async (code: string, orderValue: number) => {
    const result = await validatePromoCode(code, orderValue);
    
    if (result.success) {
      toast.success(`Promo applied! You save ₹${result.discount.toFixed(0)}`);
    } else {
      toast.error(result.error);
    }

    return result;
  };

  const recordPromoUsage = async (deliveryRequestId: string) => {
    if (!user || !appliedPromo) return;

    try {
      // Record usage
      await supabase
        .from('promo_usage')
        .insert({
          user_id: user.id,
          promo_code_id: appliedPromo.id,
          delivery_request_id: deliveryRequestId,
          discount_applied: discount,
        });

      // Increment used_count on promo_codes - this needs admin/service role
      // For now, we'll skip this as it requires elevated permissions
    } catch (err) {
      console.error('Error recording promo usage:', err);
    }
  };

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
    setDiscount(0);
  }, []);

  return {
    applying,
    appliedPromo,
    discount,
    applyPromoCode,
    validatePromoCode,
    recordPromoUsage,
    clearPromo,
  };
};
