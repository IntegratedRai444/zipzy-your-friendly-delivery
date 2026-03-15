from typing import Dict, Any
from app.models.request_models import TrustScoreRequest, TrustScoreResponse

class TrustScoreService:
    def __init__(self):
        # Weighting factors for trust score calculation
        self.weights = {
            "success_rate": 0.4,
            "average_rating": 0.3,
            "complaint_penalty": 0.2,
            "cancellation_penalty": 0.1
        }

    def calculate_trust_score(self, request: TrustScoreRequest) -> TrustScoreResponse:
        """
        Calculate a dynamic trust score between 0 and 1.
        
        Formula:
        score = (success_component * w1) + (rating_component * w2) - (complaint_penalty * w3) - (cancellation_penalty * w4)
        """
        factors = request.factors
        
        # 1. Success Component (based on successful deliveries)
        # We use a logarithmic scale to reward consistent performance
        import math
        success_component = min(1.0, math.log10(factors.successful_deliveries + 1) / 2.0) if factors.successful_deliveries > 0 else 0.5
        
        # 2. Rating Component
        if factors.ratings:
            avg_rating = sum(factors.ratings) / len(factors.ratings)
            rating_component = avg_rating / 5.0  # Normalize to 0-1
        else:
            rating_component = 0.7  # Default for new users
            
        # 3. Penalties
        complaint_penalty = min(1.0, factors.complaints * 0.2)
        cancellation_penalty = min(1.0, factors.cancellations * 0.1)
        
        # Weighted sum
        score = (
            (success_component * self.weights["success_rate"]) +
            (rating_component * self.weights["average_rating"])
        )
        
        # Apply penalties as a modifier to the base score
        score = score * (1.0 - complaint_penalty) * (1.0 - cancellation_penalty)
        
        # Scale back to 0-1 and ensure bounds
        score = max(0.1, min(1.0, float(score)))
        
        # Determine trust level and tips
        trust_level, tips = self._get_trust_details(score, factors)
        
        return TrustScoreResponse(
            trust_score=float(f"{score:.2f}"),
            trust_level=trust_level,
            improvement_tips=tips
        )

    def _get_trust_details(self, score: float, factors: Any) -> tuple:
        tips = []
        if score >= 0.8:
            level = "Elite"
            tips.append("You are doing great! Keep it up.")
        elif score >= 0.6:
            level = "Reliable"
            tips.append("Try to minimize cancellations to reach Elite status.")
        elif score >= 0.4:
            level = "Building"
            tips.append("Complete more deliveries to build your history.")
        else:
            level = "At Risk"
            tips.append("Improving your rating is critical for continued access.")
            
        if factors.complaints > 0:
            tips.append("Resolving past complaints will significantly boost your score.")
            
        return level, tips
