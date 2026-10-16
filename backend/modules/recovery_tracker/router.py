"""Recovery Tracker API routes."""
from fastapi import APIRouter, HTTPException
from shared.db import fetch, fetchrow

router = APIRouter(tags=["Recovery Tracker"])

@router.get("/recovery/{event_id}")
async def get_recovery_timeline(event_id: str):
    row = await fetchrow("""
        SELECT recovery_history, created_at FROM analyses 
        WHERE event_id = $1::uuid AND status = 'complete'
        ORDER BY created_at DESC LIMIT 1
    """, event_id)
    if not row:
        raise HTTPException(404, "No completed analysis found for this event")
    history = row["recovery_history"] or []
    return {"event_id": event_id, "snapshots": history}

@router.get("/recovery/{event_id}/latest")
async def get_latest_snapshot(event_id: str):
    row = await fetchrow("""
        SELECT recovery_history FROM analyses
        WHERE event_id = $1::uuid AND status = 'complete'
        ORDER BY created_at DESC LIMIT 1
    """, event_id)
    if not row or not row["recovery_history"]:
        return {"snapshot": None}
    history = row["recovery_history"]
    latest = history[-1] if history else None
    previous = history[-2] if len(history) >= 2 else None
    return {"latest": latest, "previous": previous, "total_snapshots": len(history)}

@router.get("/recovery/module/health")
async def recovery_health():
    return {"status": "ok", "module": "recovery_tracker", "reason": "Monitoring active events"}
