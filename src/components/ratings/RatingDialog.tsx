import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryRequestId: string;
  ratedUserId: string;
  raterRole: 'sender' | 'carrier';
  otherPartyName?: string;
  onRated?: () => void;
}

export const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  deliveryRequestId,
  ratedUserId,
  raterRole,
  otherPartyName = 'Partner',
  onRated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      // Insert the rating
      const { error: ratingError } = await supabase.from('ratings').insert({
        delivery_request_id: deliveryRequestId,
        rater_id: user.id,
        rated_id: ratedUserId,
        rater_role: raterRole,
        rating,
        review: review.trim() || null,
      });

      if (ratingError) throw ratingError;

      // Update the delivery to mark as rated
      const updateField = raterRole === 'sender' ? 'buyer_rated' : 'partner_rated';
      await supabase
        .from('deliveries')
        .update({ [updateField]: true })
        .eq('request_id', deliveryRequestId);

      toast({
        title: 'Thank you!',
        description: 'Your rating has been submitted.',
      });

      onOpenChange(false);
      onRated?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your {raterRole === 'sender' ? 'carrier' : 'sender'}</DialogTitle>
          <DialogDescription>
            How was your experience with {otherPartyName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Label */}
          <p className="text-center text-sm text-muted-foreground">
            {displayRating === 0 && 'Select a rating'}
            {displayRating === 1 && 'Poor'}
            {displayRating === 2 && 'Fair'}
            {displayRating === 3 && 'Good'}
            {displayRating === 4 && 'Very Good'}
            {displayRating === 5 && 'Excellent'}
          </p>

          {/* Review Text */}
          <Textarea
            placeholder="Write a review (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};