import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, MapPin, Clock, CheckCircle, Truck, AlertCircle, LogOut, Route, MessageCircle, Wallet, Star, Package, Navigation, X, Shield, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
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
import { Card, CardContent } from '@/components/ui/card';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useCarrierAvailability } from '@/hooks/useCarrierAvailability';
import { useNearbyRequests } from '@/hooks/useNearbyRequests';
import { useCarrierDeliveries } from '@/hooks/useCarrierDeliveries';
import { useTrustScore } from '@/hooks/useTrustScore';
import { CarrierToggle } from '@/components/carrier/CarrierToggle';
import { PartnerRequestCard } from '@/components/partner/PartnerRequestCard';
import { ActiveDeliveryCard } from '@/components/carrier/ActiveDeliveryCard';
import { TrustScoreCard } from '@/components/trust/TrustScoreCard';
import type { Database } from '@/integrations/supabase/types';

type RequestRow = Database['public']['Tables']['requests']['Row'];
type Delivery = Database['public']['Tables']['deliveries']['Row'] & {
  requests: RequestRow | null;
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Finding Partner' },
  matched: { icon: CheckCircle, color: 'text-blue-600 bg-blue-100', label: 'Partner Found' },
  picked_up: { icon: Package, color: 'text-purple-600 bg-purple-100', label: 'Purchased' },
  in_transit: { icon: Truck, color: 'text-primary bg-primary/10', label: 'On the Way' },
  delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Delivered' },
  cancelled: { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Cancelled' },
};

const Requests: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user, signOut, isPartner } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [userRequests, setUserRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatDeliveryId, setChatDeliveryId] = useState<string | null>(null);
  const [trackingDeliveryId, setTrackingDeliveryId] = useState<string | null>(null);
  const [cancelDeliveryId, setCancelDeliveryId] = useState<string | null>(null);
  const [ratingRequest, setRatingRequest] = useState<RequestRow | null>(null);
  const [disputeRequest, setDisputeRequest] = useState<RequestRow | null>(null);

  // Partner Hooks
  const { availability, isOnline, toggleOnline, updating: partnerUpdating } = useCarrierAvailability();
  const { requests: nearbyRequests, loading: requestsLoading } = useNearbyRequests();
  const { 
    activeDeliveries: partnerActiveTasks, 
    completedDeliveries: partnerHistory,
    acceptRequest, 
    updateStatus, 
    refetch: refetchPartnerData 
  } = useCarrierDeliveries();
  const { trustScore } = useTrustScore();
  const [partnerModeActive, setPartnerModeActive] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserRequests();

    // Subscribe to realtime updates for user's requests
    const channel = supabase
      .channel('user-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
        },
        (payload) => {
          const newRequest = payload.new as RequestRow;
          const oldRequest = payload.old as RequestRow;
          
          // Refresh if it's our request
          if (newRequest?.buyer_id === user?.id || oldRequest?.buyer_id === user?.id) {
            fetchUserRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (id) {
      if (location.pathname.includes('/chat/')) {
        setChatDeliveryId(id);
      } else if (location.pathname.includes('/delivery/')) {
        setTrackingDeliveryId(id);
      }
    }
  }, [id, location.pathname]);

  const activeRequests = userRequests.filter(r => !['delivered', 'cancelled'].includes(r.status || ''));
  const pastRequests = userRequests.filter(r => ['delivered', 'cancelled'].includes(r.status || ''));

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

            {isPartner && (
              <Button 
                variant={partnerModeActive ? "default" : "outline"} 
                onClick={() => setPartnerModeActive(!partnerModeActive)}
                className={partnerModeActive ? "" : "border-primary/20 bg-primary/5 hover:bg-primary/10"}
              >
                <Route className="w-4 h-4 mr-2" />
                {partnerModeActive ? "Switch to User Mode" : "Partner Mode"}
              </Button>
            )}

            {!partnerModeActive && (
              <Button asChild size="lg">
                <Link to="/request">
                  <Plus className="w-5 h-5 mr-2" />
                  New Request
                </Link>
              </Button>
            )}
          </div>
        </div>

        {partnerModeActive ? (
          /* Partner Integrated View */
          <div className="space-y-8">
            <CarrierToggle
              isOnline={isOnline}
              onToggle={toggleOnline}
              updating={partnerUpdating}
            />

            <TrustScoreCard trustScore={trustScore} />

            {partnerActiveTasks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  My Active Tasks ({partnerActiveTasks.length})
                </h2>
                <div className="space-y-4">
                  {partnerActiveTasks.map((delivery) => (
                    <ActiveDeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onUpdateStatus={updateStatus}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Nearby Requests
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isOnline ? 'Scanning for requests' : 'Go online to see requests'}
                </div>
              </div>

              {!isOnline ? (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="py-10 text-center">
                    <Route className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Go online to start seeing nearby delivery requests.</p>
                  </CardContent>
                </Card>
              ) : requestsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
              ) : nearbyRequests.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">No nearby requests found. Try adjusting your detour settings.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {nearbyRequests.map((request) => (
                    <PartnerRequestCard
                      key={request.id}
                      request={request as any}
                      onAccept={async (id) => {
                        setAcceptingId(id);
                        await acceptRequest(id);
                        setAcceptingId(null);
                      }}
                      accepting={acceptingId === request.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* User View (Existing) */
          <>
          {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
          </div>
        ) : userRequests.length === 0 ? (
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
            {activeRequests.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Active ({activeRequests.length})</h2>
                <div className="grid gap-4">
                  {activeRequests.map((request) => (
                    <RequestCard 
                      key={request.id} 
                      request={request as any} 
                      onChatClick={() => setChatDeliveryId(request.id)}
                      onTrackClick={
                        request.status === 'in_transit' 
                          ? () => setTrackingDeliveryId(trackingDeliveryId === request.id ? null : request.id)
                          : undefined
                      }
                      onCancelClick={
                        ['pending', 'matched'].includes(request.status || '')
                          ? () => setCancelDeliveryId(request.id)
                          : undefined
                      }
                      isTracking={trackingDeliveryId === request.id}
                      showMap={trackingDeliveryId === request.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Requests */}
            {pastRequests.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Past Requests</h2>
                  <ExportDeliveryHistory deliveries={pastRequests as any} />
                </div>
                <div className="grid gap-4">
                  {pastRequests.map((request: any) => (
                    <RequestCard 
                      key={request.id} 
                      request={request}
                      onRateClick={
                        request.status === 'delivered' && !request.deliveries?.[0]?.buyer_rated && request.deliveries?.[0]?.partner_id
                          ? () => setRatingRequest(request)
                          : undefined
                      }
                      onDisputeClick={
                        request.status === 'delivered' && request.deliveries?.[0]?.partner_id
                          ? () => setDisputeRequest(request)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
          </>
        )}
      </main>

      <ChatSheet
        open={!!chatDeliveryId}
        onOpenChange={(open) => !open && setChatDeliveryId(null)}
        deliveryRequestId={chatDeliveryId}
        otherPartyName="Partner"
      />

      {ratingRequest && (
        <RatingDialog
          open={!!ratingRequest}
          onOpenChange={(open) => !open && setRatingRequest(null)}
          deliveryRequestId={ratingRequest.id}
          ratedUserId={((ratingRequest as any).deliveries?.[0]?.partner_id) || ''}
          raterRole="sender"
          otherPartyName="Partner"
          onRated={fetchUserRequests}
        />
      )}

      <CancelRequestDialog
        open={!!cancelDeliveryId}
        onOpenChange={(open) => !open && setCancelDeliveryId(null)}
        deliveryRequestId={cancelDeliveryId || ''}
        onCancelled={fetchUserRequests}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />

      {disputeRequest && (
        <RaiseDisputeDialog
          open={!!disputeRequest}
          onOpenChange={(open) => !open && setDisputeRequest(null)}
          deliveryRequestId={disputeRequest.id}
          againstUserId={((disputeRequest as any).deliveries?.[0]?.partner_id) || ''}
        />
      )}
    </div>
  );
};

interface RequestCardProps {
  request: RequestRow & { deliveries?: Database['public']['Tables']['deliveries']['Row'][] };
  onChatClick?: () => void;
  onRateClick?: () => void;
  onTrackClick?: () => void;
  onCancelClick?: () => void;
  onDisputeClick?: () => void;
  isTracking?: boolean;
  showMap?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onChatClick, onRateClick, onTrackClick, onCancelClick, onDisputeClick, isTracking, showMap }) => {
  const status = statusConfig[request.status || 'pending'] || statusConfig.pending;
  const delivery = request.deliveries?.[0];
  const StatusIcon = status.icon;
  const canChat = delivery?.partner_id && !['delivered', 'cancelled'].includes(request.status || '');
  const canTrack = request.status === 'in_transit';
  const canCancel = ['pending', 'matched'].includes(request.status || '');
  const canDispute = request.status === 'delivered' && delivery?.partner_id;
  
  // Show pickup OTP when matched, drop OTP when in_transit
  const showPickupOtp = request.status === 'matched' && delivery?.pickup_otp;
  const showDropOtp = request.status === 'in_transit' && delivery?.drop_otp;
  
  const { partnerLocation } = useLocationTracking({
    deliveryRequestId: showMap ? request.id : undefined,
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
            <h3 className="font-semibold truncate">{request.item_name || request.item_description}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">Delivering to {request.drop_city}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(request.created_at), 'MMM d, yyyy • h:mm a')}
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
            <p className="font-semibold">₹{request.reward || 0}</p>
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
              {showPickupOtp ? (delivery?.pickup_otp || '----') : (delivery?.drop_otp || '----')}
            </div>
          </div>
        </div>
      )}
      
      {/* Live Tracking Map */}
      {showMap && (
        <LiveTrackingMap 
          partnerLocation={partnerLocation}
          pickupAddress={request.pickup_address || ''}
          dropAddress={request.drop_address || ''}
          className="h-64 mt-4"
        />
      )}
    </div>
  );
};

export default Requests;
