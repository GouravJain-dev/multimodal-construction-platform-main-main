import logging
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.v1 import router as api_v1_router
from app.services.gemini_client import is_gemini_active

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal AI-Powered Decision-Support System for Construction Management, Site Safety, and Structural Analytics.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }

# Health Check
@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Health"])
async def health_check():
    ai_mode = "gemini-live" if is_gemini_active() else "calibrated-heuristic"
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "ai_mode": ai_mode,
        "model": settings.GEMINI_MODEL if is_gemini_active() else "calibrated-civil-engine",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include API v1 and convenience alias routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
app.include_router(api_v1_router, prefix="/api")

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify payload formatting."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
