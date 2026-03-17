import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updated_at: string;
}

interface UseLocationTrackingProps {
  deliveryRequestId?: string;
  isPartner?: boolean;
}

export const useLocationTracking = ({ deliveryRequestId, isPartner = false }: UseLocationTrackingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partnerLocation, setPartnerLocation] = useState<Location | null>(null);
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Update partner location in database
  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!user || !deliveryRequestId) return;

    const locationData = {
      partner_id: user.id,
      delivery_request_id: deliveryRequestId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      updated_at: new Date().toISOString(),
    };

    // Upsert location (update if exists, insert if not)
    const { error } = await supabase
      .from('partner_locations')
      .upsert(locationData, { 
        onConflict: 'partner_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error updating location:', error);
    }
  }, [user, deliveryRequestId]);

  // Start tracking partner's location (for partners)
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support location tracking',
        variant: 'destructive',
      });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position);
        setTracking(true);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location error',
          description: 'Unable to get your location. Please enable location services.',
          variant: 'destructive',
        });
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
    setTracking(true);
  }, [updateLocation, toast]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
  }, [watchId]);

  // Subscribe to partner location updates (for customers)
  useEffect(() => {
    if (!deliveryRequestId || isPartner) return;

    // Fetch initial location
    const fetchLocation = async () => {
      const { data, error } = await supabase
        .from('partner_locations')
        .select('*')
        .eq('delivery_request_id', deliveryRequestId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setPartnerLocation({
          latitude: (data.location as any)?.coordinates?.[1] || 0,
          longitude: (data.location as any)?.coordinates?.[0] || 0,
          accuracy: data.accuracy ?? undefined,
          heading: data.heading ?? undefined,
          speed: data.speed ?? undefined,
          updated_at: data.updated_at,
        });
      }
    };

    fetchLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`partner-location-${deliveryRequestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_locations',
          filter: `delivery_request_id=eq.${deliveryRequestId}`,
        },
        (payload) => {
          const newLocation = payload.new as any;
          if (newLocation) {
            setPartnerLocation({
              latitude: newLocation.location?.coordinates?.[1] || 0,
              longitude: newLocation.location?.coordinates?.[0] || 0,
              accuracy: newLocation.accuracy,
              heading: newLocation.heading,
              speed: newLocation.speed,
              updated_at: newLocation.updated_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryRequestId, isPartner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    partnerLocation,
    tracking,
    startTracking,
    stopTracking,
  };
};
