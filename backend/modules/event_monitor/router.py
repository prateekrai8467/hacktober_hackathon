"""Event Monitor — API routes."""
from fastapi import APIRouter, HTTPException
from shared.db import fetch, fetchrow

router = APIRouter(tags=["Event Monitor"])

@router.get("/events")
async def list_events():
    """All active events as GeoJSON FeatureCollection, sorted by severity then recency."""
    rows = await fetch("""
        SELECT id, gdacs_id, usgs_id, title, event_type, severity,
               lat, lon, event_date, country, country_code,
               affected_population, active, created_at
        FROM events
        WHERE active = true
        ORDER BY 
            CASE severity WHEN 'red' THEN 0 WHEN 'orange' THEN 1 ELSE 2 END,
            event_date DESC
        LIMIT 100
    """)
    
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row["lon"], row["lat"]]},
            "properties": {
                "id": str(row["id"]),
                "gdacs_id": row["gdacs_id"],
                "title": row["title"],
                "event_type": row["event_type"],
                "severity": row["severity"],
                "lat": row["lat"],
                "lon": row["lon"],
                "event_date": row["event_date"].isoformat() if row["event_date"] else None,
                "country": row["country"],
                "affected_population": row["affected_population"],
            }
        })
    
    return {"type": "FeatureCollection", "features": features}

@router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Full details for one event."""
    row = await fetchrow("SELECT * FROM events WHERE id = $1::uuid", event_id)
    if not row:
        raise HTTPException(404, "Event not found")
    return dict(row)

@router.get("/events/module/health")
async def event_monitor_health():
    return {"status": "ok", "module": "event_monitor", "reason": "Polling active"}
