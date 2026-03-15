from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ai_endpoints import router as ai_router
from app.config import settings

app = FastAPI(
    title="Zipzy AI Intelligence Service",
    description="AI-powered intelligence layer for Zipzy campus delivery platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include AI endpoints router
app.include_router(ai_router)

# CORS middleware for React frontend and Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "http://localhost:3001",  # Node.js backend
        "https://wezzkfolnfcryyuetjwm.supabase.co"  # Supabase
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Zipzy AI Intelligence Service",
        "description": "AI layer for intelligent delivery operations",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Zipzy AI Intelligence Service",
        "version": "1.0.0",
        "endpoints": {
            "ai_services": "/api/ai/",
            "documentation": "/docs",
            "health_check": "/health"
        },
        "features": [
            "Natural Language Order Extraction",
            "Smart Pricing Estimation", 
            "Partner Matching AI",
            "ETA Prediction",
            "Fraud Risk Detection",
            "Demand Analysis",
            "Zipzy AI Chat Assistant"
        ],
        "api_endpoints": [
            "POST /ai/extract-order - Extract orders from natural language",
            "POST /ai/estimate-price - Estimate delivery pricing",
            "POST /ai/match-partner - Rank delivery partners",
            "POST /ai/predict-eta - Predict delivery time",
            "POST /ai/fraud-score - Detect fraud risk",
            "POST /ai/demand-analysis - Analyze demand patterns",
            "POST /ai/chat - AI assistant chat",
            "GET /ai/help - Help menu and FAQ"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
