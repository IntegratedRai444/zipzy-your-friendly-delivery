import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerTrips } from '@/hooks/usePartnerTrips';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Plus, Search } from 'lucide-react';
import { CreateTripDialog } from '@/components/partner/CreateTripDialog';
import { TripCard } from '@/components/partner/TripCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const PartnerTrips: React.FC = () => {
  const { user } = useAuth();
  const { myTrips, allTrips, loading, cancelTrip } = usePartnerTrips();
  const [searchQuery, setSearchQuery] = React.useState('');

  const activeMyTrips = myTrips.filter(t => t.is_active);
  const pastMyTrips = myTrips.filter(t => !t.is_active);

  const filteredAllTrips = allTrips.filter(trip => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      trip.from_city.toLowerCase().includes(query) ||
      trip.to_city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/partner">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Calendar className="w-5 h-5 text-background" />
              </div>
              <div>
                <span className="text-lg font-display font-bold">Partner Trips</span>
                <p className="text-xs text-muted-foreground">Post & find trips</p>
              </div>
            </div>
          </div>

          <CreateTripDialog />
        </div>
      </header>

      <main className="container py-6">
        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-foreground/5 border border-border mb-6">
          <p className="text-sm text-center text-muted-foreground">
            🚗 Post your upcoming trips and let buyers find you, or browse trips to request items.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="browse" className="gap-1.5">
              <Search className="w-4 h-4" />
              Browse Trips
            </TabsTrigger>
            <TabsTrigger value="my-trips" className="gap-1.5">
              <MapPin className="w-4 h-4" />
              My Trips ({activeMyTrips.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by city..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredAllTrips.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">
                  {searchQuery ? 'No trips found' : 'No upcoming trips'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'Be the first to post a trip and help others!'
                  }
                </p>
                {!searchQuery && (
                  <CreateTripDialog 
                    trigger={
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Post Your Trip
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAllTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onCancel={cancelTrip}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-trips" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : myTrips.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No trips posted</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                  Post your upcoming trips to let buyers know where you're headed.
                </p>
                <CreateTripDialog 
                  trigger={
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Post Your First Trip
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-6">
                {activeMyTrips.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Trips</h3>
                    <div className="space-y-4">
                      {activeMyTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          onCancel={cancelTrip}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {pastMyTrips.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Past Trips</h3>
                    <div className="space-y-4">
                      {pastMyTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          showActions={false}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PartnerTrips;
