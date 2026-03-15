import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CancelRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryRequestId: string;
  onCancelled?: () => void;
}

export const CancelRequestDialog: React.FC<CancelRequestDialogProps> = ({
  open,
  onOpenChange,
  deliveryRequestId,
  onCancelled,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || 'Cancelled by user',
          cancelled_by: user.id,
        })
        .eq('id', deliveryRequestId)
        .eq('buyer_id', user.id)
        .in('status', ['pending', 'matched']);

      if (error) throw error;

      // Also try to update deliveries table if it exists
      await supabase
        .from('deliveries')
        .update({ status: 'cancelled' })
        .eq('request_id', deliveryRequestId);

      if (error) throw error;

      toast.success('Request cancelled');
      onOpenChange(false);
      onCancelled?.();
    } catch (err) {
      console.error('Failed to cancel:', err);
      toast.error('Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. If a partner has already accepted, they will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="Tell us why you're cancelling..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep Request</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
