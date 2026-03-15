from typing import Dict, Any
from app.models.request_models import PricingRequest, PricingResponse, UrgencyLevelEnum, ItemCategoryEnum, ItemSizeEnum
from app.utils.geo_utils import GeoUtils
from app.config import settings
from datetime import datetime

class PricingService:
    def __init__(self):
        self.geo_utils = GeoUtils()
        
        # Base pricing configuration
        self.base_costs = {
            "food": 30,
            "groceries": 40,
            "electronics": 50,
            "documents": 25,
            "clothing": 35,
            "task": 45,
            "other": 30
        }
        
        # Size multipliers
        self.size_multipliers = {
            "small": 1.0,
            "medium": 1.5,
            "large": 2.0,
            "extra_large": 2.5
        }
        
        # Urgency multipliers
        self.urgency_multipliers = {
            "normal": 1.0,
            "urgent": 2.0
        }
        
        # Distance cost per km
        self.distance_cost_per_km = 15
        
        # Demand multipliers by time
        self.demand_multipliers = {
            "peak_hours": 1.3,  # 7pm-9pm
            "normal_hours": 1.0
        }
    
    def estimate_price(self, request: PricingRequest) -> PricingResponse:
        """Estimate delivery price strictly based on distance, capped 10-30"""
        try:
            # Calculate distance
            distance_km = self.geo_utils.estimate_campus_distance(
                request.pickup_location, 
                request.drop_location
            )
            
            # Simple distance logic
            distance_based_value = round(distance_km * 10)
            
            # Cap the delivery reward strictly between 10 to 30
            reward = max(10.0, min(30.0, float(distance_based_value)))
            
            return PricingResponse(
                estimated_price=reward,  # Keep this field for backwards compatibility if needed
                price_breakdown={"distance_based_reward": reward},
                base_cost=reward,
                distance_cost=reward,
                urgency_cost=0.0,
                demand_cost=0.0,
                distance_km=round(distance_km, 2)
            )
            
        except Exception as e:
            # Fallback pricing safely within 10-30 constraint
            return PricingResponse(
                estimated_price=15.0,
                price_breakdown={"distance_based_reward": 15.0},
                base_cost=15.0,
                distance_km=1.5
            )
    
    def _calculate_demand_cost(self) -> float:
        """Calculate demand cost based on current time"""
        from datetime import datetime
        
        current_hour = datetime.now().hour
        
        # Peak hours: 7pm-9pm (19:00-21:00)
        if 19 <= current_hour <= 21:
            return 20.0  # Fixed demand cost during peak hours
        
        return 0.0
    
    def get_price_factors(self, request: PricingRequest) -> Dict[str, Any]:
        """Get explanation of pricing factors"""
        
        distance_km = self.geo_utils.estimate_campus_distance(
            request.pickup_location, 
            request.drop_location
        )
        
        factors = {
            "base_delivery_cost": self.base_costs.get(request.item_category.value, 30),
            "item_category": request.item_category.value,
            "distance_km": round(distance_km, 2),
            "urgency_level": request.urgency.value,
            "item_size": request.item_size.value,
            "peak_hour_surcharge": 19 <= datetime.now().hour <= 21
        }
        
        return factors
