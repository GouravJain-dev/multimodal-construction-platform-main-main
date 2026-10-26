from fastapi import APIRouter
from .safety import router as safety_router
from .crack import router as crack_router
from .planning import router as planning_router
from .valuation import router as valuation_router
from .daily_log import router as daily_log_router
from .weather import router as weather_router
from .chat import router as chat_router
from .samples import router as samples_router

router = APIRouter()

router.include_router(safety_router, prefix="/safety", tags=["Safety Monitoring"])
router.include_router(crack_router, prefix="/crack", tags=["Crack & Structural Assessment"])
router.include_router(planning_router, prefix="/planning", tags=["Project Planning"])
router.include_router(valuation_router, prefix="/valuation", tags=["Real Estate Valuation"])
router.include_router(daily_log_router, prefix="/daily-log", tags=["Daily Site Assistant"])
router.include_router(weather_router, prefix="/weather", tags=["Weather Advisory"])
router.include_router(chat_router, prefix="/chat", tags=["Knowledge Assistant"])
router.include_router(samples_router, prefix="/samples", tags=["Preset Samples"])
