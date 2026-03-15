import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updated_at: string;
}

interface LiveTrackingMapProps {
  partnerLocation: Location | null;
  pickupAddress?: string;
  dropAddress?: string;
  className?: string;
}

// Custom marker icons using data URLs
const partnerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: hsl(var(--foreground)); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  partnerLocation,
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    const defaultCenter: L.LatLngExpression = [28.6139, 77.209]; // Delhi as default
    
    mapRef.current = L.map(mapContainer.current, {
      center: partnerLocation 
        ? [partnerLocation.latitude, partnerLocation.longitude] 
        : defaultCenter,
      zoom: 15,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles (free, no API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add partner marker if location exists
    if (partnerLocation) {
      markerRef.current = L.marker(
        [partnerLocation.latitude, partnerLocation.longitude],
        { icon: partnerIcon }
      ).addTo(mapRef.current);

      markerRef.current.bindPopup('Partner is here');
    }

    // Cleanup
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when location changes
  useEffect(() => {
    if (!mapRef.current || !partnerLocation) return;

    const newLatLng: L.LatLngExpression = [partnerLocation.latitude, partnerLocation.longitude];

    if (markerRef.current) {
      markerRef.current.setLatLng(newLatLng);
    } else {
      markerRef.current = L.marker(newLatLng, { icon: partnerIcon })
        .addTo(mapRef.current);
      markerRef.current.bindPopup('Partner is here');
    }

    // Smoothly pan to new location
    mapRef.current.panTo(newLatLng, { animate: true, duration: 0.5 });
  }, [partnerLocation]);

  if (!partnerLocation) {
    return (
      <div className={`rounded-xl bg-muted flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Waiting for partner to start tracking...
        </p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[200px]" />
      
      {/* Location info overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
            <Navigation className="w-4 h-4 text-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Partner is on the way</p>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(partnerLocation.updated_at).toLocaleTimeString()}
            </p>
          </div>
          {partnerLocation.speed && partnerLocation.speed > 0 && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {Math.round(partnerLocation.speed * 3.6)} km/h
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
