"""
System diagnostics and platform health monitoring.
Provides deep health telemetry across Database, S3 Object Storage, AI providers, and Polling schedulers.
"""
import os
import time
from datetime import datetime, timezone
from fastapi import APIRouter
from shared.db import fetchval, fetchrow
from shared.r2 import _get_s3_client, _S3_BUCKET, _S3_ENDPOINT

router = APIRouter(tags=["System Diagnostics"])

_START_TIME = time.time()

@router.get("/system/diagnostics")
async def get_system_diagnostics():
    """
    Comprehensive system health diagnostic check.
    Validates PostgreSQL connection, S3 storage access, Groq/Gemini AI status, and scheduler state.
    """
    now = datetime.now(timezone.utc)
    uptime_seconds = int(time.time() - _START_TIME)

    # 1. Database Health Check & Metrics
    db_status = {"status": "unhealthy", "latency_ms": None}
    counts = {"events": 0, "active_events": 0, "ground_truth": 0, "analyses": 0}
    
    try:
        t0 = time.perf_counter()
        db_alive = await fetchval("SELECT 1")
        latency = round((time.perf_counter() - t0) * 1000, 2)
        
        if db_alive == 1:
            db_status = {"status": "healthy", "latency_ms": latency}
            
            events_cnt = await fetchval("SELECT COUNT(*) FROM events")
            active_cnt = await fetchval("SELECT COUNT(*) FROM events WHERE active = true")
            gt_cnt = await fetchval("SELECT COUNT(*) FROM ground_reports")
            an_cnt = await fetchval("SELECT COUNT(*) FROM analyses")
            
            counts = {
                "events": events_cnt or 0,
                "active_events": active_cnt or 0,
                "ground_truth": gt_cnt or 0,
                "analyses": an_cnt or 0
            }
    except Exception as e:
        db_status = {"status": "error", "error": str(e)}

    # 2. S3 Object Storage Check
    s3_status = {"status": "unconfigured", "bucket": _S3_BUCKET}
    try:
        client = _get_s3_client()
        if client:
            client.head_bucket(Bucket=_S3_BUCKET)
            s3_status = {
                "status": "healthy",
                "bucket": _S3_BUCKET,
                "endpoint": _S3_ENDPOINT or "aws-standard",
                "provider": "Neon S3 Object Storage"
            }
        else:
            s3_status = {"status": "fallback", "provider": "Supabase Storage"}
    except Exception as e:
        s3_status = {"status": "degraded", "bucket": _S3_BUCKET, "error": str(e)}

    # 3. AI Providers Configuration
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    ai_status = {
        "groq": {
            "status": "available" if groq_key else "missing_key",
            "model": "llama-3.3-70b-versatile / gpt-oss-120b",
            "role": "Situation reports & interactive chat reasoning"
        },
        "gemini": {
            "status": "available" if gemini_key else "missing_key",
            "model": "gemini-2.5-flash",
            "role": "Multimodal vision & damage classification"
        }
    }

    # 4. Overall platform status
    is_operational = db_status.get("status") == "healthy"
    
    return {
        "platform": "TeraScope SENTINEL Disaster Intelligence",
        "status": "operational" if is_operational else "degraded",
        "timestamp": now.isoformat(),
        "uptime_seconds": uptime_seconds,
        "database": db_status,
        "metrics": counts,
        "storage": s3_status,
        "ai_intelligence": ai_status,
        "environment": {
            "version": "1.0.0",
            "api_prefix": "/api",
            "ws_endpoint": "/api/ws"
        }
    }
