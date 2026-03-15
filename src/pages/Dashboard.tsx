import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, MapPin, Clock, CheckCircle, Truck, AlertCircle, LogOut, Route, MessageCircle, Wallet, Star, Package, Navigation, X, Shield, AlertTriangle, HelpCircle } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ChatSheet } from '@/components/chat/ChatSheet';
import { RatingDialog } from '@/components/ratings/RatingDialog';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';
import { CancelRequestDialog } from '@/components/delivery/CancelRequestDialog';
import { ExportDeliveryHistory } from '@/components/delivery/ExportDeliveryHistory';
import { RaiseDisputeDialog } from '@/components/disputes/RaiseDisputeDialog';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useOnboarding } from '@/hooks/useOnboarding';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['delivery_requests']['Row'];

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Finding Partner' },
  matched: { icon: CheckCircle, color: 'text-blue-600 bg-blue-100', label: 'Partner Found' },
  picked_up: { icon: Package, color: 'text-purple-600 bg-purple-100', label: 'Purchased' },
  in_transit: { icon: Truck, color: 'text-primary bg-primary/10', label: 'On the Way' },
  delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Delivered' },
  cancelled: { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Cancelled' },
};

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatDeliveryId, setChatDeliveryId] = useState<string | null>(null);
  const [ratingDelivery, setRatingDelivery] = useState<DeliveryRequest | null>(null);
  const [trackingDeliveryId, setTrackingDeliveryId] = useState<string | null>(null);
  const [cancelDeliveryId, setCancelDeliveryId] = useState<string | null>(null);
  const [disputeDelivery, setDisputeDelivery] = useState<DeliveryRequest | null>(null);

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDeliveries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to realtime updates for user's deliveries
    const channel = supabase
      .channel('user-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
        },
        (payload) => {
          const newDelivery = payload.new as DeliveryRequest;
          const oldDelivery = payload.old as DeliveryRequest;
          
          // Refresh if it's our delivery
          if (newDelivery?.user_id === user?.id || oldDelivery?.user_id === user?.id) {
            fetchDeliveries();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const activeDeliveries = deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status));
  const pastDeliveries = deliveries.filter(d => ['delivered', 'cancelled'].includes(d.status));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-display font-bold">Zipzy</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/profile">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-foreground text-background text-xs">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">My Requests</h1>
            <p className="text-muted-foreground">Track items you&apos;ve requested</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/admin">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/wallet">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/support">
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </Link>
            </Button>

            <Button asChild size="lg">
              <Link to="/request">
                <Plus className="w-5 h-5 mr-2" />
                New Request
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
          </div>
        ) : deliveries.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No requests yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Need something from far away? Create a request and a nearby partner will buy and deliver it for you.
            </p>
            <Button asChild size="lg">
              <Link to="/request">
                <Plus className="w-5 h-5 mr-2" />
                Create Request
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Requests */}
            {activeDeliveries.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Active ({activeDeliveries.length})</h2>
                <div className="grid gap-4">
                  {activeDeliveries.map((delivery) => (
                    <RequestCard 
                      key={delivery.id} 
                      delivery={delivery} 
                      onChatClick={() => setChatDeliveryId(delivery.id)}
                      onTrackClick={
                        delivery.status === 'in_transit' 
                          ? () => setTrackingDeliveryId(trackingDeliveryId === delivery.id ? null : delivery.id)
                          : undefined
                      }
                      onCancelClick={
                        ['pending', 'matched'].includes(delivery.status)
                          ? () => setCancelDeliveryId(delivery.id)
                          : undefined
                      }
                      isTracking={trackingDeliveryId === delivery.id}
                      showMap={trackingDeliveryId === delivery.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Requests */}
            {pastDeliveries.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Past Requests</h2>
                  <ExportDeliveryHistory deliveries={pastDeliveries} />
                </div>
                <div className="grid gap-4">
                  {pastDeliveries.map((delivery) => (
                    <RequestCard 
                      key={delivery.id} 
                      delivery={delivery}
                      onRateClick={
                        delivery.status === 'delivered' && !delivery.sender_rated && delivery.carrier_id
                          ? () => setRatingDelivery(delivery)
                          : undefined
                      }
                      onDisputeClick={
                        delivery.status === 'delivered' && delivery.carrier_id
                          ? () => setDisputeDelivery(delivery)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <ChatSheet
        open={!!chatDeliveryId}
        onOpenChange={(open) => !open && setChatDeliveryId(null)}
        deliveryRequestId={chatDeliveryId}
        otherPartyName="Partner"
      />

      {ratingDelivery && (
        <RatingDialog
          open={!!ratingDelivery}
          onOpenChange={(open) => !open && setRatingDelivery(null)}
          deliveryRequestId={ratingDelivery.id}
          ratedUserId={ratingDelivery.carrier_id!}
          raterRole="sender"
          otherPartyName="Partner"
          onRated={fetchDeliveries}
        />
      )}

      <CancelRequestDialog
        open={!!cancelDeliveryId}
        onOpenChange={(open) => !open && setCancelDeliveryId(null)}
        deliveryRequestId={cancelDeliveryId || ''}
        onCancelled={fetchDeliveries}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />

      {disputeDelivery && (
        <RaiseDisputeDialog
          open={!!disputeDelivery}
          onOpenChange={(open) => !open && setDisputeDelivery(null)}
          deliveryRequestId={disputeDelivery.id}
          againstUserId={disputeDelivery.carrier_id!}
        />
      )}
    </div>
  );
};

interface RequestCardProps {
  delivery: DeliveryRequest;
  onChatClick?: () => void;
  onRateClick?: () => void;
  onTrackClick?: () => void;
  onCancelClick?: () => void;
  onDisputeClick?: () => void;
  isTracking?: boolean;
  showMap?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({ delivery, onChatClick, onRateClick, onTrackClick, onCancelClick, onDisputeClick, isTracking, showMap }) => {
  const status = statusConfig[delivery.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const canChat = delivery.carrier_id && !['delivered', 'cancelled'].includes(delivery.status);
  const canTrack = delivery.status === 'in_transit';
  const canCancel = ['pending', 'matched'].includes(delivery.status);
  const canDispute = delivery.status === 'delivered' && delivery.carrier_id;
  
  // Show pickup OTP when matched, drop OTP when in_transit
  const showPickupOtp = delivery.status === 'matched' && delivery.pickup_otp;
  const showDropOtp = delivery.status === 'in_transit' && delivery.drop_otp;
  
  const { partnerLocation } = useLocationTracking({
    deliveryRequestId: showMap ? delivery.id : undefined,
    isPartner: false,
  });

  return (
    <div className="bg-background rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{delivery.item_description}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">Delivering to {delivery.drop_city}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(delivery.created_at), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canCancel && onCancelClick && (
            <Button variant="ghost" size="sm" onClick={onCancelClick} className="text-destructive hover:text-destructive">
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
          )}
          {onRateClick && (
            <Button variant="outline" size="sm" onClick={onRateClick}>
              <Star className="w-4 h-4 mr-1.5" />
              Rate
            </Button>
          )}
          {canDispute && onDisputeClick && (
            <Button variant="ghost" size="sm" onClick={onDisputeClick} className="text-amber-600 hover:text-amber-700">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Dispute
            </Button>
          )}
          {canTrack && onTrackClick && (
            <Button 
              variant={isTracking ? "default" : "outline"} 
              size="sm" 
              onClick={onTrackClick}
            >
              <Navigation className="w-4 h-4 mr-1.5" />
              {isTracking ? 'Hide Map' : 'Track Live'}
            </Button>
          )}
          {canChat && onChatClick && (
            <Button variant="outline" size="sm" onClick={onChatClick}>
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Chat
            </Button>
          )}
          <div className="flex flex-col items-end gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </div>
            <p className="font-semibold">₹{delivery.estimated_fare}</p>
          </div>
        </div>
      </div>
      
      {/* OTP Section - Show to buyer so they can share with partner */}
      {(showPickupOtp || showDropOtp) && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {showPickupOtp ? 'PICKUP OTP' : 'DELIVERY OTP'}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/60 mt-0.5">
                {showPickupOtp 
                  ? 'Share this code with your partner at pickup'
                  : 'Share this code when partner delivers'}
              </p>
            </div>
            <div className="text-2xl font-mono font-bold tracking-wider text-amber-800 dark:text-amber-300">
              {showPickupOtp ? delivery.pickup_otp : delivery.drop_otp}
            </div>
          </div>
        </div>
      )}
      
      {/* Live Tracking Map */}
      {showMap && (
        <LiveTrackingMap 
          partnerLocation={partnerLocation}
          pickupAddress={delivery.pickup_address}
          dropAddress={delivery.drop_address}
          className="h-64 mt-4"
        />
      )}
    </div>
  );
};

export default Dashboard;
