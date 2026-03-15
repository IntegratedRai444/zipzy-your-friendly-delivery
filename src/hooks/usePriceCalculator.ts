import { useMemo } from 'react';

interface PriceBreakdown {
  baseFare: number;
  sizeFee: number;
  urgencyFee: number;
  distanceFee: number;
  platformFee: number;
  partnerReward: number;
  totalPrice: number;
}

interface CalculatePriceParams {
  itemSize: 'small' | 'medium' | 'large';
  urgency: 'standard' | 'express' | 'urgent';
  distanceKm?: number;
  itemValue?: number;
}

const BASE_FARE = 30; // Base fare in INR

const SIZE_MULTIPLIERS: Record<string, number> = {
  small: 1,
  medium: 1.5,
  large: 2,
};

const URGENCY_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  express: 1.5,
  urgent: 2,
};

const DISTANCE_RATE = 3; // INR per km
const PLATFORM_FEE_PERCENT = 15; // 15% platform fee
const INSURANCE_RATE = 0.02; // 2% of item value for insurance

export const usePriceCalculator = () => {
  const calculatePrice = useMemo(() => {
    return ({
      itemSize,
      urgency,
      distanceKm = 5,
      itemValue = 0,
    }: CalculatePriceParams): PriceBreakdown => {
      // Base calculations
      const baseFare = BASE_FARE;
      const sizeFee = baseFare * (SIZE_MULTIPLIERS[itemSize] - 1);
      const urgencyFee = baseFare * (URGENCY_MULTIPLIERS[urgency] - 1);
      const distanceFee = Math.max(0, (distanceKm - 2) * DISTANCE_RATE); // First 2km free
      
      // Subtotal before platform fee
      const subtotal = baseFare + sizeFee + urgencyFee + distanceFee;
      
      // Platform fee
      const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100));
      
      // Partner reward is subtotal minus platform fee
      const partnerReward = subtotal - platformFee;
      
      // Total price for buyer
      const totalPrice = subtotal;

      return {
        baseFare: Math.round(baseFare),
        sizeFee: Math.round(sizeFee),
        urgencyFee: Math.round(urgencyFee),
        distanceFee: Math.round(distanceFee),
        platformFee,
        partnerReward: Math.round(partnerReward),
        totalPrice: Math.round(totalPrice),
      };
    };
  }, []);

  const getEstimatedRange = useMemo(() => {
    return (urgency: 'standard' | 'express' | 'urgent'): { min: number; max: number } => {
      const minPrice = calculatePrice({ itemSize: 'small', urgency, distanceKm: 2 });
      const maxPrice = calculatePrice({ itemSize: 'large', urgency, distanceKm: 15 });
      
      return {
        min: minPrice.totalPrice,
        max: maxPrice.totalPrice,
      };
    };
  }, [calculatePrice]);

  return {
    calculatePrice,
    getEstimatedRange,
    PLATFORM_FEE_PERCENT,
    INSURANCE_RATE,
  };
};
