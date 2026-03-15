from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

class ItemCategoryEnum(str, Enum):
    FOOD = "food"
    GROCERIES = "groceries"
    TASK = "task"
    ELECTRONICS = "electronics"
    DOCUMENTS = "documents"
    CLOTHING = "clothing"
    OTHER = "other"

class UrgencyLevelEnum(str, Enum):
    NORMAL = "normal"
    URGENT = "urgent"

class ItemSizeEnum(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    EXTRA_LARGE = "extra_large"

class RiskLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Natural Language Order Extraction
class OrderExtraction(BaseModel):
    item_name: str
    pickup_location: str
    drop_location: str
    urgency: UrgencyLevelEnum = UrgencyLevelEnum.NORMAL
    category: ItemCategoryEnum = ItemCategoryEnum.OTHER

class OrderExtractionRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

class OrderExtractionResponse(BaseModel):
    success: bool
    extracted_order: Optional[OrderExtraction] = None
    confidence: float = 0.0
    error_message: Optional[str] = None

# Smart Pricing
class PricingRequest(BaseModel):
    pickup_location: str
    drop_location: str
    urgency: UrgencyLevelEnum = UrgencyLevelEnum.NORMAL
    item_category: ItemCategoryEnum = ItemCategoryEnum.OTHER
    item_size: ItemSizeEnum = ItemSizeEnum.SMALL
    estimated_value: Optional[float] = None

class PricingResponse(BaseModel):
    estimated_price: float
    price_breakdown: Dict[str, float] = {}
    base_cost: Optional[float] = None
    distance_cost: Optional[float] = None
    urgency_cost: Optional[float] = None
    demand_cost: Optional[float] = None
    distance_km: Optional[float] = None

# Partner Matching
class PartnerInfo(BaseModel):
    partner_id: str
    name: str
    rating: float = Field(ge=0, le=5)
    trust_score: float = Field(ge=0, le=1)
    current_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_online: bool = True
    completed_deliveries: int = 0
    acceptance_rate: float = Field(ge=0, le=1)
    delivery_history: List[Dict[str, Any]] = []
    availability: bool = True

class MatchingRequest(BaseModel):
    pickup_location: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    partner_locations: List[Dict[str, Any]] = []
    partner_ratings: Dict[str, float] = {}
    trust_scores: Dict[str, float] = {}
    delivery_history: Dict[str, List[Dict[str, Any]]] = {}
    availability: Dict[str, bool] = {}

class PartnerRecommendation(BaseModel):
    partner_id: str
    score: float = Field(ge=0, le=1)
    reasons: List[str] = []

class MatchingResponse(BaseModel):
    recommended_partners: List[PartnerRecommendation]

# ETA Prediction
class ETAPredictionRequest(BaseModel):
    pickup_location: str
    drop_location: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    campus_distance: Optional[float] = None
    historical_data: List[Dict[str, Any]] = []
    partner_speed: Optional[float] = None

class ETAPredictionResponse(BaseModel):
    estimated_time_minutes: int
    confidence: float = Field(ge=0, le=1)
    factors: Dict[str, Any] = {}

# Fraud Detection
class UserBehavior(BaseModel):
    user_id: str
    cancellation_rate: float = Field(ge=0, le=1)
    repeated_cancellations: int = 0
    abnormal_wallet_transactions: int = 0
    unusual_delivery_behavior: bool = False
    account_age_days: int
    verification_status: str

class RequestPattern(BaseModel):
    fake_delivery_indicators: List[str] = []
    repeated_cancellations: bool = False
    abnormal_transactions: bool = False
    unusual_behavior_patterns: List[str] = []

class FraudDetectionRequest(BaseModel):
    user_behavior: UserBehavior
    request_pattern: RequestPattern

class FraudDetectionResponse(BaseModel):
    fraud_score: float = Field(ge=0, le=1)
    risk_level: RiskLevelEnum
    reason: str

# Demand Prediction
class DemandPoint(BaseModel):
    location: str
    latitude: float
    longitude: float
    request_count: int
    hour_of_day: int

class DemandAnalysisRequest(BaseModel):
    request_history: List[Dict[str, Any]] = []
    time_period_hours: int = 24

class DemandAnalysisResponse(BaseModel):
    hotspots: List[str]
    peak_hours: List[str]
    recommended_partner_distribution: Dict[str, int] = {}

# Chat Assistant
class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    requires_data: bool = False
    data_request: Optional[str] = None
    actions: List[str] = []

# Generic API Response
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Trust Score
class TrustScoreFactors(BaseModel):
    successful_deliveries: int
    ratings: List[float]
    complaints: int
    cancellations: int

class TrustScoreRequest(BaseModel):
    user_id: str
    factors: TrustScoreFactors

class TrustScoreResponse(BaseModel):
    trust_score: float = Field(ge=0, le=1)
    trust_level: str
    improvement_tips: List[str] = []
