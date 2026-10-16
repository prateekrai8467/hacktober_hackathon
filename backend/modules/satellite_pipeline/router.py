"""Satellite Pipeline API routes."""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from shared.db import fetch, fetchrow
from modules.satellite_pipeline.service import trigger_pipeline

router = APIRouter(tags=["Satellite Pipeline"])

class TriggerRequest(BaseModel):
    event_id: str

@router.post("/satellite/trigger")
async def trigger_satellite(req: TriggerRequest, background_tasks: BackgroundTasks):
    """Manually trigger satellite pipeline for an event."""
    event = await fetchrow("SELECT id FROM events WHERE id = $1::uuid", req.event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    background_tasks.add_task(trigger_pipeline, req.event_id)
    return {"status": "triggered", "event_id": req.event_id}

@router.get("/satellite/passes/{event_id}")
async def get_passes(event_id: str):
    """All satellite passes for an event (timeline data)."""
    rows = await fetch("""
        SELECT id, pass_date, sensor, cloud_cover_pct, tile_id, bbox,
               is_event_pass, is_baseline, thumbnail_url
        FROM satellite_passes
        WHERE event_id = $1::uuid
        ORDER BY pass_date DESC
    """, event_id)
    return [dict(r) for r in rows]

@router.get("/satellite/analyses/{event_id}")
async def get_analyses(event_id: str):
    """Get all analyses for an event."""
    rows = await fetch("""
        SELECT id, job_id, status, stats, infrastructure, population,
               pre_thumbnail_url, post_thumbnail_url, public_slug,
               building_assessment_status, report_status, created_at
        FROM analyses
        WHERE event_id = $1::uuid
        ORDER BY created_at DESC
    """, event_id)
    return [dict(r) for r in rows]

@router.get("/satellite/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Full analysis including damage GeoJSON."""
    row = await fetchrow("""
        SELECT * FROM analyses WHERE id = $1::uuid
    """, analysis_id)
    if not row:
        raise HTTPException(404, "Analysis not found")
    return dict(row)

@router.get("/satellite/module/health")
async def satellite_health():
    from shared.quota import check_sentinel_quota
    quota_ok = await check_sentinel_quota()
    return {
        "status": "ok" if quota_ok else "degraded",
        "module": "satellite_pipeline",
        "reason": "Operational" if quota_ok else "Sentinel Hub quota near limit"
    }
