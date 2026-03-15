import math
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.request_models import ETAPredictionRequest, ETAPredictionResponse
from app.utils.geo_utils import GeoUtils

class ETAService:
    def __init__(self):
        self.geo_utils = GeoUtils()
        
        # Base delivery times (in minutes) for different scenarios
        self.base_times = {
            "walking": {
                "short_distance": 10,  # < 1km
                "medium_distance": 20, # 1-2km
                "long_distance": 35     # > 2km
            },
            "bicycle": {
                "short_distance": 5,
                "medium_distance": 10,
                "long_distance": 18
            }
        }
        
        # Time-based multipliers
        self.time_multipliers = {
            "peak_hours": 1.5,      # 8-10am, 12-2pm, 5-7pm
            "normal_hours": 1.0,
            "late_night": 1.3       # 10pm-6am
        }
        
        # Location complexity factors
        self.location_complexity = {
            "high": 1.4,   # Library, Admin Block, multiple floors
            "medium": 1.2, # Academic blocks, hostels
            "low": 1.0     # Canteen, open areas
        }
    
    def predict_eta(self, request: ETAPredictionRequest) -> ETAPredictionResponse:
        """Predict estimated time of arrival for delivery"""
        
        try:
            # Calculate distance
            if request.campus_distance:
                distance_km = request.campus_distance
            else:
                distance_km = self.geo_utils.estimate_campus_distance(
                    request.pickup_location, request.drop_location
                )
            
            # Determine distance category
            distance_category = self._get_distance_category(distance_km)
            
            # Get base time
            base_time = self._get_base_time(distance_category)
            
            # Apply time-based multiplier
            time_multiplier = self._get_time_multiplier()
            
            # Apply location complexity multiplier
            location_multiplier = self._get_location_multiplier(
                request.pickup_location, request.drop_location
            )
            
            # Apply partner speed adjustment if available
            partner_speed_adjustment = self._get_partner_speed_adjustment(request.partner_speed)
            
            # Apply historical data adjustment if available
            historical_adjustment = self._get_historical_adjustment(request.historical_data)
            
            # Calculate final ETA
            eta_minutes = int(base_time * time_multiplier * location_multiplier * partner_speed_adjustment * historical_adjustment)
            
            # Calculate confidence based on data availability
            confidence = self._calculate_confidence(request)
            
            # Create factors breakdown
            factors = {
                "base_time_minutes": base_time,
                "distance_km": round(distance_km, 2),
                "time_multiplier": time_multiplier,
                "location_multiplier": location_multiplier,
                "partner_speed_adjustment": partner_speed_adjustment,
                "historical_adjustment": historical_adjustment,
                "current_time": datetime.now().strftime("%H:%M"),
                "distance_category": distance_category
            }
            
            return ETAPredictionResponse(
                estimated_time_minutes=eta_minutes,
                confidence=confidence,
                factors=factors
            )
            
        except Exception as e:
            print(f"Error predicting ETA: {e}")
            # Fallback ETA
            return ETAPredictionResponse(
                estimated_time_minutes=20,
                confidence=0.5,
                factors={"error": str(e)}
            )
    
    def _get_distance_category(self, distance_km: float) -> str:
        """Categorize distance for time calculation"""
        if distance_km <= 1.0:
            return "short_distance"
        elif distance_km <= 2.0:
            return "medium_distance"
        else:
            return "long_distance"
    
    def _get_base_time(self, distance_category: str) -> int:
        """Get base delivery time for distance category"""
        # Assume walking as default mode for campus deliveries
        return self.base_times["walking"][distance_category]
    
    def _get_time_multiplier(self) -> float:
        """Get time-based multiplier based on current time"""
        current_hour = datetime.now().hour
        
        # Peak hours: 8-10am, 12-2pm, 5-7pm
        if (8 <= current_hour <= 10) or (12 <= current_hour <= 14) or (17 <= current_hour <= 19):
            return self.time_multipliers["peak_hours"]
        # Late night: 10pm-6am
        elif current_hour >= 22 or current_hour <= 6:
            return self.time_multipliers["late_night"]
        else:
            return self.time_multipliers["normal_hours"]
    
    def _get_location_multiplier(self, pickup: str, drop: str) -> float:
        """Get location complexity multiplier"""
        
        # Check if either location has high complexity
        pickup_complexity = self._get_location_complexity(pickup)
        drop_complexity = self._get_location_complexity(drop)
        
        # Use the higher complexity
        if pickup_complexity == "high" or drop_complexity == "high":
            return self.location_complexity["high"]
        elif pickup_complexity == "medium" or drop_complexity == "medium":
            return self.location_complexity["medium"]
        else:
            return self.location_complexity["low"]
    
    def _get_location_complexity(self, location: str) -> str:
        """Determine complexity level of a location"""
        location_lower = location.lower()
        
        if any(keyword in location_lower for keyword in ["library", "admin", "reception", "office"]):
            return "high"
        elif any(keyword in location_lower for keyword in ["block", "hostel", "academic"]):
            return "medium"
        else:
            return "low"
    
    def _get_partner_speed_adjustment(self, partner_speed: Optional[float]) -> float:
        """Get speed adjustment based on partner's average speed"""
        
        if not partner_speed:
            return 1.0  # Default adjustment
        
        # partner_speed is in km/min, convert to adjustment factor
        # Average campus walking speed is about 0.1 km/min (6 km/h)
        average_speed = 0.1
        
        if partner_speed > average_speed * 1.5:  # Very fast
            return 0.8
        elif partner_speed > average_speed * 1.2:  # Fast
            return 0.9
        elif partner_speed < average_speed * 0.7:  # Slow
            return 1.3
        else:
            return 1.0
    
    def _get_historical_adjustment(self, historical_data: list) -> float:
        """Get adjustment based on historical delivery data"""
        
        if not historical_data:
            return 1.0
        
        # Calculate average actual vs estimated time from historical data
        total_ratio = 0
        count = 0
        
        for data in historical_data:
            if data.get("estimated_time") and data.get("actual_time"):
                ratio = data["actual_time"] / data["estimated_time"]
                total_ratio += ratio
                count += 1
        
        if count == 0:
            return 1.0
        
        average_ratio = total_ratio / count
        
        # Cap the adjustment to reasonable bounds
        return max(0.5, min(2.0, average_ratio))
    
    def _calculate_confidence(self, request: ETAPredictionRequest) -> float:
        """Calculate confidence score for the prediction"""
        
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on data availability
        if request.pickup_latitude and request.pickup_longitude:
            confidence += 0.1  # Exact coordinates available
        
        if request.drop_latitude and request.drop_longitude:
            confidence += 0.1  # Exact drop coordinates available
        
        if request.historical_data:
            confidence += 0.2  # Historical data available
        
        if request.partner_speed:
            confidence += 0.1  # Partner speed data available
        
        return min(1.0, confidence)
    
    def get_eta_factors_explanation(self, factors: Dict[str, Any]) -> str:
        """Generate human-readable explanation of ETA factors"""
        
        explanations = []
        
        base_time = factors.get("base_time_minutes", 0)
        explanations.append(f"Base delivery time: {base_time} minutes")
        
        distance = factors.get("distance_km", 0)
        explanations.append(f"Distance: {distance} km")
        
        time_mult = factors.get("time_multiplier", 1.0)
        if time_mult > 1.2:
            explanations.append("Currently in peak hours - may take longer")
        elif time_mult < 0.8:
            explanations.append("Currently off-peak - may be faster")
        
        location_mult = factors.get("location_multiplier", 1.0)
        if location_mult > 1.2:
            explanations.append("Complex locations may require extra time")
        
        partner_adj = factors.get("partner_speed_adjustment", 1.0)
        if partner_adj < 1.0:
            explanations.append("Partner is faster than average")
        elif partner_adj > 1.0:
            explanations.append("Partner may take longer than average")
        
        return " | ".join(explanations)
