"""Ground Truth API routes."""
import hashlib
from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from shared.db import fetch, fetchrow
from modules.ground_truth.service import submit_ground_report

router = APIRouter(tags=["Ground Truth"])

@router.post("/ground-truth/submit")
async def submit_report(
    request: Request,
    event_id: str = Form(...),
    lat: float = Form(...),
    lon: float = Form(...),
    description: str = Form(""),
    photo: UploadFile = File(...)
):
    """Submit a ground photo report. Rate limited to 10/IP/event/hour. No login required."""
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()
    
    photo_bytes = await photo.read()
    result = await submit_ground_report(event_id, lat, lon, description, photo_bytes, ip_hash)
    
    if "error" in result:
        raise HTTPException(429, result["error"])
    return result

@router.get("/ground-truth/submissions/{event_id}")
async def list_submissions(event_id: str):
    rows = await fetch("""
        SELECT id, damage_class, damage_type, ai_confidence, description,
               photo_url, satellite_class, agreement, disputed, created_at,
               ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
        FROM ground_reports
        WHERE event_id = $1::uuid
        ORDER BY created_at DESC
    """, event_id)
    
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row["lon"] or 0, row["lat"] or 0]},
            "properties": {
                "id": str(row["id"]),
                "damage_class": row["damage_class"],
                "damage_type": row["damage_type"],
                "confidence": row["ai_confidence"],
                "description": row["description"],
                "photo_url": row["photo_url"],
                "satellite_class": row["satellite_class"],
                "agreement": row["agreement"],
                "disputed": row["disputed"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/ground-truth/disputed/{event_id}")
async def disputed_reports(event_id: str):
    rows = await fetch("""
        SELECT * FROM ground_reports WHERE event_id = $1::uuid AND disputed = true
    """, event_id)
    return [dict(r) for r in rows]

@router.get("/ground-truth/stats/{event_id}")
async def ground_truth_stats(event_id: str):
    row = await fetchrow("""
        SELECT 
            COUNT(*) as total,
            AVG(CASE WHEN agreement = true THEN 1.0 ELSE 0.0 END) as agreement_rate,
            COUNT(*) FILTER (WHERE damage_class = 0) as intact_count,
            COUNT(*) FILTER (WHERE damage_class = 1) as minor_count,
            COUNT(*) FILTER (WHERE damage_class = 2) as major_count,
            COUNT(*) FILTER (WHERE damage_class = 3) as destroyed_count
        FROM ground_reports WHERE event_id = $1::uuid
    """, event_id)
    return dict(row) if row else {}

@router.get("/ground-truth/module/health")
async def ground_truth_health():
    return {"status": "ok", "module": "ground_truth", "reason": "Accepting submissions"}
