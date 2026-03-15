import math
from typing import List, Dict, Any
from app.models.request_models import MatchingRequest, MatchingResponse, PartnerRecommendation
from app.utils.geo_utils import GeoUtils

class MatchingService:
    def __init__(self):
        self.geo_utils = GeoUtils()
        
        # Scoring weights (sum to 1.0)
        self.weights = {
            "distance": 0.30,
            "rating": 0.25,
            "trust_score": 0.20,
            "availability": 0.15,
            "experience": 0.10
        }
    
    def match_partners(self, request: MatchingRequest) -> MatchingResponse:
        """Rank and recommend best partners for a delivery request"""
        
        try:
            recommendations = []
            
            # Get pickup coordinates
            pickup_lat = request.pickup_latitude
            pickup_lon = request.pickup_longitude
            
            if not pickup_lat or not pickup_lon:
                # Fallback to location name geocoding
                coords = self.geo_utils.geocode_location(request.pickup_location)
                pickup_lat, pickup_lon = coords
            
            # Score each partner from partner_locations list
            for partner_data in request.partner_locations:
                partner_id = partner_data.get('id')
                if not partner_id:
                    continue
                    
                if not request.availability.get(partner_id, True):
                    continue  # Skip unavailable partners
                
                # Get partner location
                location = partner_data
                partner_lat = location.get('latitude')
                partner_lon = location.get('longitude')
                
                # Calculate individual scores
                distance_score = self._calculate_distance_score(
                    pickup_lat, pickup_lon, partner_lat, partner_lon
                )
                
                rating_score = self._calculate_rating_score(
                    request.partner_ratings.get(partner_id, 0)
                )
                
                trust_score = self._calculate_trust_score(
                    request.trust_scores.get(partner_id, 0)
                )
                
                availability_score = 1.0 if request.availability.get(partner_id, True) else 0.0
                
                experience_score = self._calculate_experience_score(
                    request.delivery_history.get(partner_id, [])
                )
                
                # Calculate weighted total score
                total_score = (
                    distance_score * self.weights["distance"] +
                    rating_score * self.weights["rating"] +
                    trust_score * self.weights["trust_score"] +
                    availability_score * self.weights["availability"] +
                    experience_score * self.weights["experience"]
                )
                
                # Generate reasons for recommendation
                reasons = self._generate_reasons(
                    distance_score, rating_score, trust_score, 
                    availability_score, experience_score
                )
                
                recommendation = PartnerRecommendation(
                    partner_id=partner_id,
                    score=round(total_score, 3),
                    reasons=reasons
                )
                
                recommendations.append(recommendation)
            
            # Sort by score (highest first)
            recommendations.sort(key=lambda x: x.score, reverse=True)
            
            return MatchingResponse(
                recommended_partners=recommendations[:5]  # Top 5 recommendations
            )
            
        except Exception as e:
            print(f"Error in partner matching: {e}")
            return MatchingResponse(recommended_partners=[])
    
    def _calculate_distance_score(self, pickup_lat: float, pickup_lon: float, 
                                 partner_lat: float, partner_lon: float) -> float:
        """Calculate distance-based score (closer is better)"""
        
        if not partner_lat or not partner_lon:
            return 0.3  # Default score for unknown location
        
        distance_km = self.geo_utils.calculate_distance_km(
            pickup_lat, pickup_lon, partner_lat, partner_lon
        )
        
        # Score decreases with distance
        if distance_km <= 0.5:  # Within 500m
            return 1.0
        elif distance_km <= 1.0:  # Within 1km
            return 0.8
        elif distance_km <= 2.0:  # Within 2km
            return 0.6
        elif distance_km <= 3.0:  # Within 3km
            return 0.4
        else:  # More than 3km
            return max(0.1, 1.0 - (distance_km / 5.0))
    
    def _calculate_rating_score(self, rating: float) -> float:
        """Calculate rating-based score"""
        # Normalize rating (0-5) to score (0-1)
        return min(1.0, rating / 5.0)
    
    def _calculate_trust_score(self, trust_score: float) -> float:
        """Calculate trust-based score"""
        # Trust score is already normalized (0-1)
        return trust_score
    
    def _calculate_experience_score(self, delivery_history: List[Dict[str, Any]]) -> float:
        """Calculate experience-based score from delivery history"""
        
        if not delivery_history:
            return 0.3  # Default score for new partners
        
        completed_deliveries = len(delivery_history)
        
        # Score based on experience level
        if completed_deliveries >= 100:
            return 1.0
        elif completed_deliveries >= 50:
            return 0.8
        elif completed_deliveries >= 20:
            return 0.6
        elif completed_deliveries >= 10:
            return 0.4
        elif completed_deliveries >= 5:
            return 0.3
        else:
            return 0.2
    
    def _generate_reasons(self, distance_score: float, rating_score: float, 
                         trust_score: float, availability_score: float, 
                         experience_score: float) -> List[str]:
        """Generate human-readable reasons for partner recommendation"""
        
        reasons = []
        
        if distance_score >= 0.8:
            reasons.append("Very close to pickup location")
        elif distance_score >= 0.6:
            reasons.append("Near pickup location")
        
        if rating_score >= 0.8:
            reasons.append("Excellent rating")
        elif rating_score >= 0.6:
            reasons.append("Good rating")
        
        if trust_score >= 0.8:
            reasons.append("Highly trusted partner")
        elif trust_score >= 0.6:
            reasons.append("Trusted partner")
        
        if experience_score >= 0.8:
            reasons.append("Very experienced")
        elif experience_score >= 0.6:
            reasons.append("Experienced partner")
        
        if availability_score == 0:
            reasons.append("Currently unavailable")
        
        return reasons
    
    def get_partner_ranking_factors(self, partner_id: str, request: MatchingRequest) -> Dict[str, Any]:
        """Get detailed breakdown of ranking factors for a specific partner"""
        
        # Find partner in locations list
        location = next((p for p in request.partner_locations if p.get('id') == partner_id), {})
        pickup_lat = request.pickup_latitude
        pickup_lon = request.pickup_longitude
        
        if not pickup_lat or not pickup_lon:
            coords = self.geo_utils.geocode_location(request.pickup_location)
            pickup_lat, pickup_lon = coords
        
        factors = {
            "distance_score": self._calculate_distance_score(
                pickup_lat, pickup_lon, location.get('latitude'), location.get('longitude')
            ),
            "rating_score": self._calculate_rating_score(
                request.partner_ratings.get(partner_id, 0)
            ),
            "trust_score": self._calculate_trust_score(
                request.trust_scores.get(partner_id, 0)
            ),
            "availability_score": 1.0 if request.availability.get(partner_id, True) else 0.0,
            "experience_score": self._calculate_experience_score(
                request.delivery_history.get(partner_id, [])
            ),
            "weights": self.weights
        }
        
        # Calculate total score explicitly to avoid type issues
        factors["total_score"] = (
            factors["distance_score"] * self.weights["distance"] +
            factors["rating_score"] * self.weights["rating"] +
            factors["trust_score"] * self.weights["trust_score"] +
            factors["availability_score"] * self.weights["availability"] +
            factors["experience_score"] * self.weights["experience"]
        )
        
        return factors
