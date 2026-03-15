import math
from typing import Tuple, Optional
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from app.config import settings

class GeoUtils:
    def __init__(self):
        try:
            self.geolocator = Nominatim(user_agent="zipzy_ai")
        except:
            self.geolocator = None
    
    def calculate_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        try:
            return geodesic((lat1, lon1), (lat2, lon2)).kilometers
        except Exception:
            # Fallback to Haversine formula
            return self._haversine_distance(lat1, lon1, lat2, lon2)
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula fallback"""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def geocode_location(self, location: str) -> Optional[Tuple[float, float]]:
        """Convert location string to coordinates"""
        if self.geolocator:
            try:
                location_obj = self.geolocator.geocode(f"{location}, campus")
                if location_obj:
                    return (location_obj.latitude, location_obj.longitude)
            except Exception as e:
                print(f"Geocoding error for '{location}': {e}")
        
        # Fallback to campus center for unknown locations
        return (settings.CAMPUS_LATITUDE, settings.CAMPUS_LONGITUDE)
    
    def estimate_campus_distance(self, location1: str, location2: str) -> float:
        """Estimate distance between two campus locations"""
        # Common campus location coordinates (approximate)
        campus_locations = {
            "canteen": (28.5450, 77.1926),
            "mess": (28.5450, 77.1926),
            "library": (28.5460, 77.1930),
            "ai block": (28.5470, 77.1940),
            "cs block": (28.5470, 77.1940),
            "hostel a": (28.5440, 77.1910),
            "hostel b": (28.5440, 77.1900),
            "hostel c": (28.5430, 77.1910),
            "block a": (28.5470, 77.1940),
            "block b": (28.5470, 77.1940),
            "night canteen": (28.5450, 77.1926),
            "sports ground": (28.5480, 77.1950),
            "gym": (28.5480, 77.1950),
            "admin block": (28.5460, 77.1920),
            "reception": (28.5460, 77.1920),
            "parking": (28.5455, 77.1915),
        }
        
        loc1_key = location1.lower().strip()
        loc2_key = location2.lower().strip()
        
        # Try to find exact matches
        coords1 = campus_locations.get(loc1_key)
        coords2 = campus_locations.get(loc2_key)
        
        # If not found, try partial matches
        if not coords1:
            for key, coords in campus_locations.items():
                if loc1_key in key or key in loc1_key:
                    coords1 = coords
                    break
        
        if not coords2:
            for key, coords in campus_locations.items():
                if loc2_key in key or key in loc2_key:
                    coords2 = coords
                    break
        
        # If still not found, use geocoding
        if not coords1:
            coords1 = self.geocode_location(location1)
        if not coords2:
            coords2 = self.geocode_location(location2)
        
        if coords1 and coords2:
            return self.calculate_distance_km(coords1[0], coords1[1], coords2[0], coords2[1])
        
        # Default fallback
        return 1.0  # 1km default for unknown locations
    
    def is_within_campus(self, latitude: float, longitude: float) -> bool:
        """Check if coordinates are within campus radius"""
        distance = self.calculate_distance_km(
            settings.CAMPUS_LATITUDE, settings.CAMPUS_LONGITUDE,
            latitude, longitude
        )
        return distance <= settings.CAMPUS_RADIUS_KM
    
    def get_location_type(self, location: str) -> str:
        """Categorize location type"""
        location_lower = location.lower()
        
        if any(keyword in location_lower for keyword in ["canteen", "mess", "food", "café", "cafe"]):
            return "food"
        elif any(keyword in location_lower for keyword in ["library", "block", "academic", "dept"]):
            return "academic"
        elif any(keyword in location_lower for keyword in ["hostel", "dorm", "room"]):
            return "residence"
        elif any(keyword in location_lower for keyword in ["sports", "ground", "gym", "play"]):
            return "recreation"
        elif any(keyword in location_lower for keyword in ["admin", "office", "reception"]):
            return "administrative"
        else:
            return "other"
