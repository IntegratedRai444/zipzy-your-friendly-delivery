import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { usePromoCodes } from '@/hooks/usePromoCodes';

interface PromoCodeInputProps {
  orderValue: number;
  onPromoApplied: (discount: number, promoId: string | null) => void;
}

export const PromoCodeInput = ({ orderValue, onPromoApplied }: PromoCodeInputProps) => {
  const [code, setCode] = useState('');
  const { applying, appliedPromo, discount, applyPromoCode, clearPromo } = usePromoCodes();

  const handleApply = async () => {
    if (!code.trim()) return;

    const result = await applyPromoCode(code, orderValue);
    if (result.success) {
      onPromoApplied(result.discount, result.promoCode?.id || null);
    }
  };

  const handleClear = () => {
    clearPromo();
    setCode('');
    onPromoApplied(0, null);
  };

  if (appliedPromo) {
    return (
      <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <div>
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {appliedPromo.code}
            </Badge>
            <p className="text-sm text-success mt-1">
              You save ₹{discount.toFixed(0)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="pl-10"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
      </div>
      <Button 
        variant="outline" 
        onClick={handleApply}
        disabled={!code.trim() || applying}
      >
        {applying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Apply'
        )}
      </Button>
    </div>
  );
};
