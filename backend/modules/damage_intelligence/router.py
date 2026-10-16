"""Damage Intelligence API routes."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from shared.db import fetch, fetchrow
from modules.damage_intelligence.service import run_building_assessment

router = APIRouter(tags=["Damage Intelligence"])

@router.get("/intelligence/{analysis_id}")
async def get_intelligence(analysis_id: str):
    row = await fetchrow("SELECT * FROM analyses WHERE id = $1::uuid", analysis_id)
    if not row:
        raise HTTPException(404, "Analysis not found")
    
    buildings = await fetch("""
        SELECT * FROM building_damage WHERE analysis_id = $1::uuid LIMIT 2000
    """, analysis_id)
    
    infra = await fetch("""
        SELECT * FROM infrastructure_risk WHERE analysis_id = $1::uuid
    """, analysis_id)
    
    return {
        "analysis_id": analysis_id,
        "stats": row["stats"],
        "infrastructure": row["infrastructure"],
        "population": row["population"],
        "buildings": [dict(b) for b in buildings],
        "at_risk_facilities": [dict(i) for i in infra]
    }

@router.get("/intelligence/buildings/{event_id}")
async def get_buildings_geojson(event_id: str):
    """Return building damage as GeoJSON for map rendering."""
    rows = await fetch("""
        SELECT id, damage_class, damage_label, confidence, source, disputed,
               ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
        FROM building_damage
        WHERE event_id = $1::uuid
        LIMIT 5000
    """, event_id)
    
    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r["lon"] or 0, r["lat"] or 0]},
            "properties": {
                "id": str(r["id"]),
                "damage_class": r["damage_class"],
                "damage_label": r["damage_label"],
                "confidence": r["confidence"],
                "source": r["source"],
                "disputed": r["disputed"]
            }
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/intelligence/infrastructure/{event_id}")
async def get_infrastructure(event_id: str):
    """Return critical facilities at risk."""
    rows = await fetch("""
        SELECT id, facility_type, name, risk_level, overlap_pct,
               ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
        FROM infrastructure_risk
        WHERE event_id = $1::uuid
        ORDER BY 
            CASE risk_level 
                WHEN 'critical' THEN 0 
                WHEN 'high' THEN 1 
                WHEN 'moderate' THEN 2 
                ELSE 3 
            END
    """, event_id)
    return [dict(r) for r in rows]

@router.post("/intelligence/{analysis_id}/trigger")
async def trigger_assessment(analysis_id: str, background_tasks: BackgroundTasks):
    """Manually trigger assessment for an analysis."""
    background_tasks.add_task(run_building_assessment, analysis_id)
    return {"status": "triggered"}

@router.get("/intelligence/module/health")
async def intelligence_health():
    import importlib.util
    osmnx_installed = importlib.util.find_spec("osmnx") is not None
    return {
        "status": "ok",
        "module": "damage_intelligence",
        "osmnx_available": osmnx_installed,
        "reason": "Operational" if osmnx_installed else "Using mock OSM data"
    }
