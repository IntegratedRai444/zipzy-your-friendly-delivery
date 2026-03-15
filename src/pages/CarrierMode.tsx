import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrierAvailability } from '@/hooks/useCarrierAvailability';
import { useNearbyRequests } from '@/hooks/useNearbyRequests';
import { useCarrierDeliveries } from '@/hooks/useCarrierDeliveries';
import { useTrustScore } from '@/hooks/useTrustScore';
import { CarrierToggle } from '@/components/carrier/CarrierToggle';
import { CarrierSettingsSheet } from '@/components/carrier/CarrierSettingsSheet';
import { RequestCard } from '@/components/carrier/RequestCard';
import { ActiveDeliveryCard } from '@/components/carrier/ActiveDeliveryCard';
import { TrustScoreCard } from '@/components/trust/TrustScoreCard';
import { RatingDialog } from '@/components/ratings/RatingDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, MapPin, History, Shield, LogOut, ArrowLeft, Star, Wallet } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['requests']['Row'];

const CarrierMode: React.FC = () => {
  const { user, signOut } = useAuth();
  const { availability, isOnline, toggleOnline, updating, updateSettings } = useCarrierAvailability();
  const { requests, loading: requestsLoading } = useNearbyRequests();
  const { activeDeliveries, completedDeliveries, acceptRequest, updateStatus, refetch } = useCarrierDeliveries();
  const { trustScore, loading: trustLoading } = useTrustScore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [ratingDelivery, setRatingDelivery] = useState<DeliveryRequest | null>(null);

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    await acceptRequest(id);
    setAcceptingId(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Package className="w-5 h-5 text-background" />
              </div>
              <div>
                <span className="text-lg font-display font-bold">Carrier Mode</span>
                <p className="text-xs text-muted-foreground">Earn by delivering</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/wallet">
                <Wallet className="w-4 h-4 mr-1.5" />
                Wallet
              </Link>
            </Button>
            <CarrierSettingsSheet 
              availability={availability} 
              onSave={updateSettings}
              saving={updating}
            />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Online Toggle */}
        <CarrierToggle
          isOnline={isOnline}
          onToggle={toggleOnline}
          updating={updating}
        />

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Active Deliveries ({activeDeliveries.length})
            </h2>
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <ActiveDeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <Tabs defaultValue="nearby" className="mt-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="nearby" className="gap-1.5">
              <MapPin className="w-4 h-4" />
              Nearby
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="trust" className="gap-1.5">
              <Shield className="w-4 h-4" />
              Trust
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="mt-4">
            {!isOnline ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">You're offline</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Go online to see delivery requests near your route
                </p>
              </div>
            ) : requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No requests nearby</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Check back later or adjust your destination settings
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    accepting={acceptingId === request.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {completedDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No delivery history</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Complete your first delivery to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedDeliveries.map((delivery) => {
                  const canRate = delivery.status === 'delivered' && !delivery.partner_rated && delivery.requests?.buyer_id;
                  return (
                    <div 
                      key={delivery.id}
                      className="bg-background rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{delivery.requests?.item_description}</p>
                          <p className="text-sm text-muted-foreground">
                            {delivery.requests?.pickup_city} → {delivery.requests?.drop_city}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {canRate && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setRatingDelivery(delivery.requests)}
                            >
                              <Star className="w-4 h-4 mr-1.5" />
                              Rate
                            </Button>
                          )}
                          <div className="text-right">
                            <p className="font-semibold">₹{delivery.requests?.reward || 0}</p>
                            <p className={`text-xs ${
                              delivery.status === 'delivered' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {delivery.status === 'delivered' ? 'Completed' : 'Cancelled'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trust" className="mt-4">
            <TrustScoreCard trustScore={trustScore} loading={trustLoading} />
          </TabsContent>
        </Tabs>
      </main>

      {ratingDelivery && (
        <RatingDialog
          open={!!ratingDelivery}
          onOpenChange={(open) => !open && setRatingDelivery(null)}
          deliveryRequestId={ratingDelivery.id}
          ratedUserId={ratingDelivery.buyer_id}
          raterRole="carrier"
          otherPartyName="Sender"
          onRated={refetch}
        />
      )}
    </div>
  );
};

export default CarrierMode;
