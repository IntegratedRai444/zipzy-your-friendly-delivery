import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { CheckCircle, Key } from 'lucide-react';

interface OTPVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: string;
  type: 'pickup' | 'drop';
  onVerified: () => void;
}

export const OTPVerificationDialog: React.FC<OTPVerificationDialogProps> = ({
  open,
  onOpenChange,
  deliveryId,
  type,
  onVerified,
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (open) {
      setOtp('');
      setVerified(false);
    }
  }, [open, deliveryId, type]);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast.error('Please enter the complete 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/deliveries/${deliveryId}/otp/verify`, { otp, type });
      
      setVerified(true);
      toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} verified!`);
      
      setTimeout(() => {
        onVerified();
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      console.error('Verification failed:', err);
      toast.error(err.message || 'Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {type === 'pickup' ? 'Pickup Verification' : 'Delivery Verification'}
          </DialogTitle>
          <DialogDescription>
            {type === 'pickup' 
              ? 'Ask the seller/shop for the 4-digit pickup code shown on their screen.'
              : 'Ask the customer for the 4-digit delivery code to confirm handover.'}
          </DialogDescription>
        </DialogHeader>

        {verified ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-600">Verified!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <InputOTP
              maxLength={4}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>

            <Button 
              onClick={handleVerify} 
              disabled={loading || otp.length !== 4}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              The {type === 'pickup' ? 'seller' : 'customer'} should have received this code via SMS/notification.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
