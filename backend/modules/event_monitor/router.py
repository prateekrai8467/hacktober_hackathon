"""Event Monitor — API routes."""
from fastapi import APIRouter, HTTPException, Query
from shared.db import fetch, fetchrow
from modules.event_monitor.service import poll_gdacs, poll_usgs, seed_demo_events

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

@router.get("/events/nearby")
async def get_nearby_events(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(500.0, description="Search radius in kilometers")
):
    """Query disasters within a spatial radius using Neon PostGIS ST_DWithin."""
    rows = await fetch("""
        SELECT id, title, event_type, severity, lat, lon, event_date, country,
               ROUND((ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000)::numeric, 1) AS distance_km
        FROM events
        WHERE active = true
          AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
        ORDER BY distance_km ASC
        LIMIT 50
    """, lat, lon, radius_km)
    return {"count": len(rows), "radius_km": radius_km, "events": [dict(r) for r in rows]}

@router.post("/events/sync")
async def trigger_event_sync():
    """Trigger an immediate live poll against GDACS RSS and USGS feeds."""
    gdacs_count = await poll_gdacs()
    usgs_count = await poll_usgs()
    total = await fetch("SELECT COUNT(*) AS total FROM events WHERE active = true")
    return {
        "status": "success",
        "ingested": {
            "gdacs": gdacs_count,
            "usgs": usgs_count
        },
        "active_events_in_db": total[0]["total"] if total else 0
    }

@router.post("/events/seed-demo")
async def seed_events():
    """Seed calibrated reference disasters for testing and hackathon demonstrations."""
    count = await seed_demo_events()
    return {"status": "success", "seeded_events": count}

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
