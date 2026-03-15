#!/usr/bin/env python3
"""
Zipzy AI Intelligence Service - Startup Script
"""

import uvicorn
from app.main import app
from app.config import settings

if __name__ == "__main__":
    print("🚀 Starting Zipzy AI Intelligence Service...")
    print(f"📍 Server: http://{settings.API_HOST}:{settings.API_PORT}")
    print(f"📚 Docs: http://{settings.API_HOST}:{settings.API_PORT}/docs")
    print(f"🔍 ReDoc: http://{settings.API_HOST}:{settings.API_PORT}/redoc")
    print(f"💚 Health: http://{settings.API_HOST}:{settings.API_PORT}/health")
    print("\n🤖 AI Features Available:")
    print("   • Natural Language Order Extraction")
    print("   • AI Chat Assistant")
    print("\n⚡ Server starting...\n")
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
