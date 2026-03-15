import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://wezzkfolnfcryyuetjwm.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "sb_publishible_PagjMO8b1TF4UCDoNwYVXw__RYQQ-vs")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Gemini AI (legacy)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    # NVIDIA NIM API
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY")
    
    # FastAPI
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Campus Configuration
    CAMPUS_LATITUDE: float = float(os.getenv("CAMPUS_LATITUDE", "28.5450"))
    CAMPUS_LONGITUDE: float = float(os.getenv("CAMPUS_LONGITUDE", "77.1926"))
    CAMPUS_RADIUS_KM: float = float(os.getenv("CAMPUS_RADIUS_KM", "5.0"))
    
    # AI Configuration
    DEFAULT_BASE_PRICE: float = 50.0
    URGENT_MULTIPLIER: float = 2.0
    LARGE_ITEM_MULTIPLIER: float = 1.5
    FRAUD_THRESHOLD: float = 0.7

settings = Settings()
