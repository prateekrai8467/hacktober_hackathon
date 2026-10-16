"""Alerts Engine API routes."""
from fastapi import APIRouter, HTTPException
from shared.db import fetch, fetchrow, execute

router = APIRouter(tags=["Alerts Engine"])

@router.get("/alerts")
async def list_alerts():
    rows = await fetch("""
        SELECT al.*, e.title as event_title
        FROM alert_log al
        LEFT JOIN events e ON e.id = al.event_id
        WHERE al.acknowledged = false
        ORDER BY 
            CASE al.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
            al.created_at DESC
        LIMIT 100
    """)
    return [dict(r) for r in rows]

@router.get("/alerts/{event_id}")
async def event_alerts(event_id: str):
    rows = await fetch("""
        SELECT * FROM alert_log WHERE event_id = $1::uuid
        ORDER BY created_at DESC LIMIT 50
    """, event_id)
    return [dict(r) for r in rows]

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    result = await execute("""
        UPDATE alert_log SET acknowledged = true, acknowledged_at = now()
        WHERE id = $1::uuid
    """, alert_id)
    return {"status": "acknowledged"}

@router.get("/alerts/module/health")
async def alerts_health():
    count = await fetchrow("SELECT COUNT(*) as cnt FROM alert_log WHERE acknowledged = false")
    return {
        "status": "ok",
        "module": "alerts_engine",
        "unread_alerts": count["cnt"] if count else 0,
        "reason": "Monitoring all modules"
    }
