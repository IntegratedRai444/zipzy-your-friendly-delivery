import { supabase } from '@/integrations/supabase/client';

interface TriggerPushPayload {
  type: 'delivery_status' | 'message' | 'dispute' | 'rating' | 'payment';
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const triggerPushNotification = async (payload: TriggerPushPayload) => {
  try {
    const { data, error } = await supabase.functions.invoke('trigger-push-notifications', {
      body: payload,
    });

    if (error) {
      console.error('Error triggering push notification:', error);
      return false;
    }

    console.log('Push notification triggered:', data);
    return true;
  } catch (error) {
    console.error('Failed to trigger push notification:', error);
    return false;
  }
};

// Convenience functions for common notification types
export const notifyDeliveryStatusChange = async (
  userId: string,
  status: string,
  itemDescription: string,
  deliveryRequestId: string
) => {
  const statusMessages: Record<string, { title: string; body: string }> = {
    matched: {
      title: 'Partner Found! 🎉',
      body: `A partner has accepted your request for "${itemDescription}"`,
    },
    picked_up: {
      title: 'Item Purchased! 🛍️',
      body: `Your "${itemDescription}" has been purchased and is ready for delivery`,
    },
    in_transit: {
      title: 'On the Way! 🚗',
      body: `Your "${itemDescription}" is now on its way to you`,
    },
    delivered: {
      title: 'Delivered! ✅',
      body: `Your "${itemDescription}" has been delivered successfully`,
    },
    cancelled: {
      title: 'Request Cancelled',
      body: `Your request for "${itemDescription}" has been cancelled`,
    },
  };

  const message = statusMessages[status] || {
    title: 'Delivery Update',
    body: `Status updated for "${itemDescription}"`,
  };

  return triggerPushNotification({
    type: 'delivery_status',
    user_id: userId,
    title: message.title,
    body: message.body,
    data: { delivery_request_id: deliveryRequestId, status },
  });
};

export const notifyNewMessage = async (
  userId: string,
  senderName: string,
  messagePreview: string,
  deliveryRequestId: string
) => {
  return triggerPushNotification({
    type: 'message',
    user_id: userId,
    title: `Message from ${senderName}`,
    body: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
    data: { delivery_request_id: deliveryRequestId },
  });
};

export const notifyDisputeUpdate = async (
  userId: string,
  status: 'open' | 'under_review' | 'resolved' | 'closed',
  resolution?: string
) => {
  const statusMessages: Record<string, { title: string; body: string }> = {
    open: {
      title: 'Dispute Submitted',
      body: 'Your dispute has been submitted and is pending review',
    },
    under_review: {
      title: 'Dispute Under Review',
      body: 'Your dispute is now being reviewed by our team',
    },
    resolved: {
      title: 'Dispute Resolved ✅',
      body: resolution ? `Your dispute has been resolved: ${resolution}` : 'Your dispute has been resolved',
    },
    closed: {
      title: 'Dispute Closed',
      body: 'Your dispute has been closed',
    },
  };

  const message = statusMessages[status];

  return triggerPushNotification({
    type: 'dispute',
    user_id: userId,
    title: message.title,
    body: message.body,
    data: { status, resolution },
  });
};

export const notifyNewRating = async (
  userId: string,
  rating: number,
  deliveryRequestId: string
) => {
  return triggerPushNotification({
    type: 'rating',
    user_id: userId,
    title: 'New Rating Received ⭐',
    body: `You received a ${rating}-star rating!`,
    data: { rating, delivery_request_id: deliveryRequestId },
  });
};

export const notifyPayment = async (
  userId: string,
  type: 'earning' | 'payout' | 'refund',
  amount: number
) => {
  const messages: Record<string, { title: string; body: string }> = {
    earning: {
      title: 'Payment Received 💰',
      body: `You earned ₹${amount} from a delivery!`,
    },
    payout: {
      title: 'Payout Processed',
      body: `Your payout of ₹${amount} has been processed`,
    },
    refund: {
      title: 'Refund Processed',
      body: `You received a refund of ₹${amount}`,
    },
  };

  const message = messages[type];

  return triggerPushNotification({
    type: 'payment',
    user_id: userId,
    title: message.title,
    body: message.body,
    data: { amount, payment_type: type },
  });
};