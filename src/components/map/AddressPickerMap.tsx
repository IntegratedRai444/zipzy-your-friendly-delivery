import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Locate, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface AddressPickerMapProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  className?: string;
}

const LocationMarker: React.FC<{
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}> = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const LocateControl: React.FC<{ onLocate: (lat: number, lng: number) => void }> = ({ onLocate }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
    
    map.once('locationfound', (e) => {
      onLocate(e.latlng.lat, e.latlng.lng);
      setLocating(false);
    });
    
    map.once('locationerror', () => {
      setLocating(false);
    });
  };

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleLocate}
        disabled={locating}
        className="shadow-md"
      >
        <Locate className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
      </Button>
    </div>
  );
};

const RecenterMap: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

export const AddressPickerMap: React.FC<AddressPickerMapProps> = ({
  onLocationSelect,
  initialLat = 20.5937,
  initialLng = 78.9629,
  className = '',
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Reverse geocode when position changes
  useEffect(() => {
    if (!position) return;
    
    const [lat, lng] = position;
    setLoading(true);
    
    // Using Nominatim for reverse geocoding (free, no API key required)
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          setAddress(data.display_name);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [position]);

  const handleConfirm = () => {
    if (position) {
      onLocationSelect(position[0], position[1], address);
    }
  };

  const handleLocate = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={position || [initialLat, initialLng]}
        zoom={position ? 15 : 5}
        className="h-full w-full min-h-[300px]"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
        <LocateControl onLocate={handleLocate} />
        {position && <RecenterMap position={position} />}
      </MapContainer>

      {/* Selected location info */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur p-4 border-t border-border">
        {position ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm line-clamp-2">
                {loading ? 'Finding address...' : address || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`}
              </p>
            </div>
            <Button 
              type="button"
              onClick={handleConfirm} 
              className="w-full" 
              size="sm"
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Tap on the map to select your location
          </p>
        )}
      </div>
    </div>
  );
};
