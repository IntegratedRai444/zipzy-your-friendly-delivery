import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Package, MapPin, MessageCircle, CheckCircle, Truck, Navigation, Key, Upload, Clock } from 'lucide-react';
import { ChatSheet } from '@/components/chat/ChatSheet';
import { TrackingButton } from '@/components/tracking/TrackingButton';
import { OTPVerificationDialog } from '@/components/delivery/OTPVerificationDialog';
import { ProofOfPurchaseUpload } from '@/components/delivery/ProofOfPurchaseUpload';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import type { Database } from '@/integrations/supabase/types';

type Delivery = Database['public']['Tables']['deliveries']['Row'] & {
  requests: Database['public']['Tables']['requests']['Row'] | null;
};
type DeliveryStatus = Database['public']['Enums']['delivery_status'];

const statusConfig: Record<string, { label: string; nextAction: string; nextStatus: DeliveryStatus | null; requiresOtp?: boolean }> = {
  assigned: { label: 'Assigned', nextAction: 'Go to Pickup', nextStatus: 'picked_up', requiresOtp: true },
  matched: { label: 'Go to Pickup', nextAction: 'Verify Pickup', nextStatus: 'picked_up', requiresOtp: true },
  picked_up: { label: 'In Transit', nextAction: 'Start Transit', nextStatus: 'in_transit' },
  in_transit: { label: 'Delivering', nextAction: 'Verify Delivery', nextStatus: 'delivered', requiresOtp: true },
  delivered: { label: 'Completed', nextAction: '', nextStatus: null },
};

interface ActiveDeliveryCardProps {
  delivery: Delivery;
  onUpdateStatus: (id: string, status: DeliveryStatus) => void;
  updating?: boolean;
}

export const ActiveDeliveryCard: React.FC<ActiveDeliveryCardProps> = ({
  delivery,
  onUpdateStatus,
  updating,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DeliveryStatus | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const config = statusConfig[delivery.status] || statusConfig.matched;
  
  const { tracking, startTracking, stopTracking } = useLocationTracking({
    deliveryRequestId: delivery.id,
    isPartner: true,
  });

  const fetchETA = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/deliveries/${delivery.id}/eta`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setEta(result.data.estimated_arrival);
      }
    } catch (err) {
      console.error('Failed to fetch ETA:', err);
    }
  };

  // Auto-start tracking when in transit
  useEffect(() => {
    if (delivery.status === 'in_transit' && !tracking) {
      startTracking();
      fetchETA();
      const interval = setInterval(fetchETA, 30000);
      return () => clearInterval(interval);
    }
  }, [delivery.status, tracking, startTracking]);

  return (
    <>
      <div className="bg-background rounded-2xl border-2 border-primary p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{delivery.requests?.item_name || delivery.requests?.item_description}</h3>
              <p className="text-sm text-muted-foreground">
                Order #{delivery.request_id?.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {eta && (
              <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                ETA: {eta}
              </div>
            )}
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {config.label}
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-green-600 mb-0.5">PICKUP</p>
              <p className="text-sm font-medium">{delivery.requests?.pickup_address}</p>
              <p className="text-xs text-muted-foreground">{delivery.requests?.pickup_city}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-red-600 mb-0.5">DROP</p>
              <p className="text-sm font-medium">{delivery.requests?.drop_address}</p>
              <p className="text-xs text-muted-foreground">{delivery.requests?.drop_city}</p>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="space-y-2 p-3 rounded-xl bg-muted mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item Price</span>
            <span>₹{delivery.requests?.item_value || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You'll Earn</span>
            <span className="text-green-600 font-semibold">₹{delivery.requests?.reward || 0}</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between font-bold">
            <span>Total Reimbursement</span>
            <span className="text-primary text-lg">
              ₹{(delivery.requests?.item_value || 0) + (delivery.requests?.reward || 0)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <TrackingButton
            tracking={tracking}
            onStartTracking={startTracking}
            onStopTracking={stopTracking}
          />
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setChatOpen(true)}>
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Chat
          </Button>
          
          {config.nextStatus && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => {
                if (config.requiresOtp) {
                  setPendingStatus(config.nextStatus);
                  setOtpDialogOpen(true);
                } else {
                  onUpdateStatus(delivery.request_id || '', config.nextStatus!);
                }
              }}
              disabled={updating}
            >
              {config.requiresOtp && <Key className="w-4 h-4 mr-1.5" />}
              {config.nextStatus === 'picked_up' && !config.requiresOtp && <Package className="w-4 h-4 mr-1.5" />}
              {config.nextStatus === 'in_transit' && <Truck className="w-4 h-4 mr-1.5" />}
              {config.nextStatus === 'delivered' && !config.requiresOtp && <CheckCircle className="w-4 h-4 mr-1.5" />}
              {config.nextAction}
            </Button>
          )}
        </div>

        {/* Proof of Purchase Upload - show when picked_up */}
        {delivery.status === 'picked_up' && (
          <div className="mt-4 pt-4 border-t border-border">
            <ProofOfPurchaseUpload
              deliveryRequestId={delivery.request_id || ''}
              existingProofUrl={delivery.purchase_proof_url || undefined}
            />
          </div>
        )}

        {/* Instructions */}
        {(delivery.requests?.pickup_notes || delivery.requests?.drop_notes) && (
          <div className="mt-4 pt-4 border-t border-border">
            {delivery.requests?.pickup_notes && delivery.status === 'matched' && (
              <div className="text-sm">
                <span className="font-medium">Pickup Note:</span>
                <span className="text-muted-foreground ml-1">{delivery.requests?.pickup_notes}</span>
              </div>
            )}
            {delivery.requests?.drop_notes && delivery.status === 'in_transit' && (
              <div className="text-sm">
                <span className="font-medium">Drop Note:</span>
                <span className="text-muted-foreground ml-1">{delivery.requests?.drop_notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        deliveryRequestId={delivery.request_id}
        otherPartyName="Sender"
      />

      <OTPVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        deliveryId={delivery.id}
        type={pendingStatus === 'picked_up' ? 'pickup' : 'drop'}
        onVerified={() => {
          if (pendingStatus) {
            onUpdateStatus(delivery.request_id || '', pendingStatus);
            setPendingStatus(null);
          }
        }}
      />
    </>
  );
};
