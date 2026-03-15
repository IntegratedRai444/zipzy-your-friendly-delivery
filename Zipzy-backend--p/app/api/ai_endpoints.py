from fastapi import APIRouter, HTTPException, Depends
from app.models.request_models import (
    OrderExtractionRequest, OrderExtractionResponse,
    PricingRequest, PricingResponse,
    MatchingRequest, MatchingResponse,
    ETAPredictionRequest, ETAPredictionResponse,
    FraudDetectionRequest, FraudDetectionResponse,
    DemandAnalysisRequest, DemandAnalysisResponse,
    ChatMessage, ChatResponse,
    TrustScoreRequest, TrustScoreResponse
)
from app.services.order_extraction_service import OrderExtractionService
from app.services.pricing_service import PricingService
from app.services.matching_service import MatchingService
from app.services.eta_service import ETAService
from app.services.fraud_service import FraudDetectionService
from app.services.demand_service import DemandService
from app.services.assistant_service import AssistantService
from app.services.trust_service import TrustScoreService

router = APIRouter(prefix="/ai", tags=["AI Services"])

# Service instances
def get_order_extraction_service():
    return OrderExtractionService()

def get_pricing_service():
    return PricingService()

def get_matching_service():
    return MatchingService()

def get_eta_service():
    return ETAService()

def get_fraud_service():
    return FraudDetectionService()

def get_demand_service():
    return DemandService()

def get_assistant_service():
    return AssistantService()

def get_trust_service():
    return TrustScoreService()

@router.post("/parse-request", response_model=OrderExtractionResponse)
async def extract_order(
    request: OrderExtractionRequest,
    service: OrderExtractionService = Depends(get_order_extraction_service)
):
    """
    Extract structured delivery data from natural language.
    
    Examples:
    - "Bring coffee from canteen to AI block"
    - "Deliver laptop from hostel A to library"
    - "Pick up Maggi from the night canteen and bring it to block B"
    
    Returns structured order data for Node.js backend to create delivery request.
    """
    try:
        result = service.extract_order(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order extraction failed: {str(e)}")

@router.post("/estimate-price", response_model=PricingResponse)
async def estimate_price(
    request: PricingRequest,
    service: PricingService = Depends(get_pricing_service)
):
    """
    Estimate delivery price based on various factors.
    
    Factors considered:
    - Base delivery cost
    - Item size category
    - Urgency
    - Estimated distance
    - Demand level
    
    Returns price prediction and breakdown.
    Node.js backend makes final pricing decisions.
    """
    try:
        result = service.estimate_price(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price estimation failed: {str(e)}")

@router.post("/match-partners", response_model=MatchingResponse)
async def match_partner(
    request: MatchingRequest,
    service: MatchingService = Depends(get_matching_service)
):
    """
    Rank and recommend best partners for delivery request.
    
    Inputs:
    - Pickup location
    - Partner locations
    - Partner ratings
    - Trust score
    - Delivery history
    - Availability
    
    Returns ranked partner list.
    Node.js will notify these partners.
    """
    try:
        result = service.match_partners(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Partner matching failed: {str(e)}")

@router.post("/predict-eta", response_model=ETAPredictionResponse)
async def predict_eta(
    request: ETAPredictionRequest,
    service: ETAService = Depends(get_eta_service)
):
    """
    Predict delivery time using multiple factors.
    
    Factors:
    - Pickup and drop locations
    - Campus distance
    - Historical delivery data
    - Partner speed
    
    Returns estimated time in minutes with confidence score.
    """
    try:
        result = service.predict_eta(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETA prediction failed: {str(e)}")

@router.post("/fraud-check", response_model=FraudDetectionResponse)
async def fraud_score(
    request: FraudDetectionRequest,
    service: FraudDetectionService = Depends(get_fraud_service)
):
    """
    Detect suspicious patterns and calculate fraud risk.
    
    Analyzes:
    - Fake deliveries
    - Repeated cancellations
    - Abnormal wallet transactions
    - Unusual delivery behavior
    
    Returns fraud score, risk level, and reason.
    """
    try:
        result = service.detect_fraud(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection failed: {str(e)}")

@router.post("/demand-heatmap", response_model=DemandAnalysisResponse)
async def demand_analysis(
    request: DemandAnalysisRequest,
    service: DemandService = Depends(get_demand_service)
):
    """
    Analyze request history and predict demand patterns.
    
    Predicts:
    - Peak hours
    - Hotspot locations
    - Recommended partner distribution
    
    Helps optimize partner positioning and resource allocation.
    """
    try:
        result = service.analyze_demand(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demand analysis failed: {str(e)}")

@router.post("/chat-assistant", response_model=ChatResponse)
async def chat_assistant(
    message: ChatMessage,
    service: AssistantService = Depends(get_assistant_service)
):
    """
    Zipzy Mini AI Assistant.
    
    Helps users with:
    - "Where is my order?"
    - "How much delivery cost?"
    - "How can I become a delivery partner?"
    - "How long will delivery take?"
    
    This assistant does NOT replace chat between user and delivery partner.
    """
    try:
        result = service.handle_chat_message(message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@router.post("/trust-score", response_model=TrustScoreResponse)
async def trust_score(
    request: TrustScoreRequest,
    service: TrustScoreService = Depends(get_trust_service)
):
    """
    Calculate dynamic trust score based on platform performance.
    
    Factors:
    - Successful deliveries
    - User ratings
    - Customer complaints
    - Order cancellations
    
    Returns trust score (0-1), trust level, and improvement tips.
    """
    try:
        result = service.calculate_trust_score(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trust score calculation failed: {str(e)}")

@router.get("/help")
async def get_help_menu():
    """Get comprehensive help menu and FAQ"""
    try:
        service = AssistantService()
        help_menu = service.get_help_menu()
        return {
            "status": "success",
            "help_menu": help_menu
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load help menu: {str(e)}")

@router.get("/health")
async def health_check():
    """AI service health check"""
    return {
        "status": "healthy",
        "service": "Zipzy AI Intelligence Service",
        "version": "1.0.0",
        "features": [
            "Natural Language Order Extraction",
            "Smart Pricing Estimation", 
            "Partner Matching AI",
            "ETA Prediction",
            "Fraud Risk Detection",
            "Demand Analysis",
            "Zipzy AI Chat Assistant"
        ],
        "endpoints": [
            "/ai/extract-order",
            "/ai/estimate-price", 
            "/ai/match-partner",
            "/ai/predict-eta",
            "/ai/fraud-score",
            "/ai/demand-analysis",
            "/ai/chat",
            "/ai/help",
            "/ai/health"
        ]
    }

# Additional utility endpoints
@router.get("/pricing/factors")
async def get_pricing_factors():
    """Get pricing factors explanation"""
    try:
        service = PricingService()
        return {
            "base_costs": service.base_costs,
            "size_multipliers": service.size_multipliers,
            "urgency_multipliers": service.urgency_multipliers,
            "distance_cost_per_km": service.distance_cost_per_km,
            "demand_multipliers": service.demand_multipliers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pricing factors: {str(e)}")

@router.get("/fraud/indicators")
async def get_fraud_indicators():
    """Get fraud indicators checklist"""
    try:
        service = FraudDetectionService()
        return service.get_fraud_indicators_checklist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get fraud indicators: {str(e)}")

@router.get("/demand/insights")
async def get_demand_insights(time_period_hours: int = 24):
    """Get detailed demand insights"""
    try:
        service = DemandService()
        request = DemandAnalysisRequest(time_period_hours=time_period_hours)
        insights = service.get_demand_insights(request)
        return {
            "status": "success",
            "insights": insights,
            "time_period_hours": time_period_hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get demand insights: {str(e)}")
