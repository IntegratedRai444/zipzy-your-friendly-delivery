from typing import Dict, Any, List
from app.models.request_models import FraudDetectionRequest, FraudDetectionResponse, RiskLevelEnum

class FraudDetectionService:
    def __init__(self):
        # Fraud detection weights
        self.weights = {
            "cancellation_rate": 0.25,
            "repeated_cancellations": 0.20,
            "abnormal_transactions": 0.20,
            "unusual_behavior": 0.15,
            "account_age": 0.10,
            "verification_status": 0.10
        }
        
        # Risk thresholds
        self.risk_thresholds = {
            "low": 0.3,
            "medium": 0.7,
            "high": 0.7
        }
    
    def detect_fraud(self, request: FraudDetectionRequest) -> FraudDetectionResponse:
        """Detect fraud risk based on user behavior and request patterns"""
        
        try:
            risk_factors = []
            fraud_score = 0.0
            
            # Analyze user behavior
            user_score = self._analyze_user_behavior(request.user_behavior, risk_factors)
            fraud_score += user_score * 0.6
            
            # Analyze request pattern
            request_score = self._analyze_request_pattern(request.request_pattern, risk_factors)
            fraud_score += request_score * 0.4
            
            # Cap the score at 1.0
            fraud_score = min(1.0, fraud_score)
            
            # Determine risk level
            risk_level = self._determine_risk_level(fraud_score)
            
            # Generate reason
            reason = self._generate_reason(risk_factors, risk_level)
            
            return FraudDetectionResponse(
                fraud_score=float(f"{fraud_score:.3f}"),
                risk_level=risk_level,
                reason=reason
            )
            
        except Exception as e:
            print(f"Error in fraud detection: {e}")
            return FraudDetectionResponse(
                fraud_score=0.5,
                risk_level=RiskLevelEnum.MEDIUM,
                reason="Unable to complete fraud analysis"
            )
    
    def _analyze_user_behavior(self, user_behavior, risk_factors: List[str]) -> float:
        """Analyze user behavior for fraud indicators"""
        
        score = 0.0
        
        # Cancellation rate analysis
        cancellation_score = self._analyze_cancellation_rate(user_behavior.cancellation_rate, risk_factors)
        score += cancellation_score * self.weights["cancellation_rate"]
        
        # Repeated cancellations
        repeated_cancellation_score = self._analyze_repeated_cancellations(
            user_behavior.repeated_cancellations, risk_factors
        )
        score += repeated_cancellation_score * self.weights["repeated_cancellations"]
        
        # Abnormal wallet transactions
        transaction_score = self._analyze_abnormal_transactions(
            user_behavior.abnormal_wallet_transactions, risk_factors
        )
        score += transaction_score * self.weights["abnormal_transactions"]
        
        # Unusual delivery behavior
        behavior_score = self._analyze_unusual_behavior(
            user_behavior.unusual_delivery_behavior, risk_factors
        )
        score += behavior_score * self.weights["unusual_behavior"]
        
        # Account age
        age_score = self._analyze_account_age(user_behavior.account_age_days, risk_factors)
        score += age_score * self.weights["account_age"]
        
        # Verification status
        verification_score = self._analyze_verification_status(user_behavior.verification_status, risk_factors)
        score += verification_score * self.weights["verification_status"]
        
        return score
    
    def _analyze_request_pattern(self, request_pattern, risk_factors: List[str]) -> float:
        """Analyze request pattern for fraud indicators"""
        
        score = 0.0
        
        # Fake delivery indicators
        if request_pattern.fake_delivery_indicators:
            fake_score = len(request_pattern.fake_delivery_indicators) * 0.2
            score += min(0.6, fake_score)
            risk_factors.append(f"Fake delivery indicators: {', '.join(request_pattern.fake_delivery_indicators)}")
        
        # Repeated cancellations
        if request_pattern.repeated_cancellations:
            score += 0.4
            risk_factors.append("Pattern of repeated cancellations")
        
        # Abnormal transactions
        if request_pattern.abnormal_transactions:
            score += 0.5
            risk_factors.append("Abnormal transaction patterns detected")
        
        # Unusual behavior patterns
        if request_pattern.unusual_behavior_patterns:
            behavior_score = len(request_pattern.unusual_behavior_patterns) * 0.15
            score += min(0.4, behavior_score)
            risk_factors.append(f"Unusual behavior: {', '.join(request_pattern.unusual_behavior_patterns)}")
        
        return min(1.0, score)
    
    def _analyze_cancellation_rate(self, rate: float, risk_factors: List[str]) -> float:
        """Analyze cancellation rate"""
        
        if rate >= 0.8:  # 80%+ cancellation rate
            risk_factors.append("Very high cancellation rate (80%+)")
            return 1.0
        elif rate >= 0.6:  # 60-80% cancellation rate
            risk_factors.append("High cancellation rate (60-80%)")
            return 0.8
        elif rate >= 0.4:  # 40-60% cancellation rate
            risk_factors.append("Moderate cancellation rate (40-60%)")
            return 0.6
        elif rate >= 0.2:  # 20-40% cancellation rate
            return 0.3
        else:  # <20% cancellation rate
            return 0.1
    
    def _analyze_repeated_cancellations(self, count: int, risk_factors: List[str]) -> float:
        """Analyze repeated cancellations"""
        
        if count >= 10:
            risk_factors.append("Excessive repeated cancellations (10+)")
            return 1.0
        elif count >= 5:
            risk_factors.append("High repeated cancellations (5-9)")
            return 0.8
        elif count >= 3:
            risk_factors.append("Moderate repeated cancellations (3-4)")
            return 0.6
        elif count >= 1:
            return 0.3
        else:
            return 0.0
    
    def _analyze_abnormal_transactions(self, count: int, risk_factors: List[str]) -> float:
        """Analyze abnormal wallet transactions"""
        
        if count >= 5:
            risk_factors.append("Multiple abnormal wallet transactions")
            return 1.0
        elif count >= 3:
            risk_factors.append("Several abnormal wallet transactions")
            return 0.7
        elif count >= 1:
            risk_factors.append("Abnormal wallet transaction detected")
            return 0.4
        else:
            return 0.0
    
    def _analyze_unusual_behavior(self, has_unusual: bool, risk_factors: List[str]) -> float:
        """Analyze unusual delivery behavior"""
        
        if has_unusual:
            risk_factors.append("Unusual delivery behavior patterns")
            return 0.7
        else:
            return 0.0
    
    def _analyze_account_age(self, days: int, risk_factors: List[str]) -> float:
        """Analyze account age"""
        
        if days <= 1:
            risk_factors.append("Very new account (1 day or less)")
            return 0.8
        elif days <= 7:
            risk_factors.append("New account (1 week or less)")
            return 0.5
        elif days <= 30:
            return 0.2
        else:
            return 0.0
    
    def _analyze_verification_status(self, status: str, risk_factors: List[str]) -> float:
        """Analyze verification status"""
        
        if status.lower() == "unverified":
            risk_factors.append("Unverified account")
            return 0.6
        elif status.lower() == "pending":
            risk_factors.append("Pending verification")
            return 0.3
        else:
            return 0.0
    
    def _determine_risk_level(self, score: float) -> RiskLevelEnum:
        """Determine risk level based on fraud score"""
        
        if score >= self.risk_thresholds["high"]:
            return RiskLevelEnum.HIGH
        elif score >= self.risk_thresholds["medium"]:
            return RiskLevelEnum.MEDIUM
        else:
            return RiskLevelEnum.LOW
    
    def _generate_reason(self, risk_factors: List[str], risk_level: RiskLevelEnum) -> str:
        """Generate human-readable reason for fraud assessment"""
        
        if not risk_factors:
            return "No significant fraud indicators detected"
        
        if risk_level == RiskLevelEnum.HIGH:
            return f"High risk due to: {', '.join(risk_factors[:3])}"
        elif risk_level == RiskLevelEnum.MEDIUM:
            return f"Medium risk due to: {', '.join(risk_factors[:2])}"
        else:
            return f"Low risk with minor concerns: {', '.join(risk_factors[:1])}"
    
    def get_fraud_indicators_checklist(self) -> Dict[str, List[str]]:
        """Get checklist of fraud indicators for monitoring"""
        
        return {
            "user_behavior": [
                "High cancellation rate (>60%)",
                "Repeated cancellations (>5)",
                "Abnormal wallet transactions",
                "Unusual delivery patterns",
                "Very new account (<7 days)",
                "Unverified account status"
            ],
            "request_patterns": [
                "Fake delivery indicators",
                "Pattern of repeated cancellations",
                "Abnormal transaction amounts",
                "Unusual request timing",
                "Suspicious item descriptions"
            ],
            "recommended_actions": {
                "low_risk": [
                    "Monitor for pattern changes",
                    "Standard verification process"
                ],
                "medium_risk": [
                    "Additional verification required",
                    "Manual review of requests",
                    "Temporary restrictions"
                ],
                "high_risk": [
                    "Immediate account suspension",
                    "Full investigation",
                    "Report to security team"
                ]
            }
        }
