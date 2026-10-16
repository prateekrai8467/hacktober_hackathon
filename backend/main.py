"""
SENTINEL — Main FastAPI Application
Mounts all 8 module routers and starts background jobs.
"""
import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

load_dotenv()

from shared.db import init_db_pool, close_db_pool
from modules.event_monitor.router import router as event_router
from modules.satellite_pipeline.router import router as satellite_router
from modules.damage_intelligence.router import router as intelligence_router
from modules.ai_reporting.router import router as reporting_router
from modules.ground_truth.router import router as ground_truth_router
from modules.recovery_tracker.router import router as recovery_router
from modules.alerts_engine.router import router as alerts_router

# Import WebSocket manager
from fastapi import WebSocket, WebSocketDisconnect
from shared.ws import manager

# Import polling jobs
from modules.event_monitor.service import poll_gdacs, poll_usgs, poll_eonet, deactivate_old_events
from modules.recovery_tracker.service import check_new_passes
from modules.alerts_engine.service import run_alert_watchers

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db_pool()
    
    # Schedule polling jobs
    scheduler.add_job(poll_gdacs, 'interval', minutes=10, id='gdacs_poll')
    scheduler.add_job(poll_usgs, 'interval', minutes=5, id='usgs_poll')
    scheduler.add_job(poll_eonet, 'interval', hours=24, id='eonet_poll')
    scheduler.add_job(deactivate_old_events, 'interval', hours=6, id='deactivate_events')
    scheduler.add_job(check_new_passes, 'interval', hours=2, id='recovery_passes')
    scheduler.add_job(run_alert_watchers, 'interval', minutes=15, id='alert_engine')
    scheduler.start()
    
    # Run initial poll on startup
    asyncio.create_task(poll_gdacs())
    asyncio.create_task(poll_usgs())
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    await close_db_pool()

app = FastAPI(
    title="SENTINEL API",
    description="Satellite-powered disaster damage assessment platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all module routers
app.include_router(event_router, prefix="/api")
app.include_router(satellite_router, prefix="/api")
app.include_router(intelligence_router, prefix="/api")
app.include_router(reporting_router, prefix="/api")
app.include_router(ground_truth_router, prefix="/api")
app.include_router(recovery_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Push initial data state immediately upon connection
        from modules.event_monitor.router import list_events
        from modules.alerts_engine.router import list_alerts
        
        events = await list_events()
        alerts = await list_alerts()
        
        await manager.broadcast("events_update", events)
        await manager.broadcast("alerts_update", alerts)
        
        while True:
            # Keep connection alive, listen for any client messages (ping/pong)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/health")
async def root_health():
    return {"status": "ok", "service": "SENTINEL API", "version": "1.0.0"}

@app.get("/api/keepalive")
async def keepalive():
    """Supabase keep-alive ping — called by Vercel cron every 3 days."""
    from shared.db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    return {"status": "alive"}

@app.get("/api/admin/storage")
async def storage_status():
    """Monitor free tier usage across Neon and R2."""
    from shared.quota import get_quota_status
    return await get_quota_status()
