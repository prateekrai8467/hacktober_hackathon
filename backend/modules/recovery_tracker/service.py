"""Recovery Tracker — monitors new satellite passes and tracks recovery over time."""
import json
import logging
from datetime import datetime, timezone
from shared.db import fetch, fetchrow, execute
from modules.satellite_pipeline.service import trigger_pipeline

logger = logging.getLogger(__name__)

async def check_new_passes():
    """For each active event, check if a new satellite pass is available."""
    active_events = await fetch("SELECT id, lat, lon, event_type FROM events WHERE active = true")
    
    for event in active_events:
        event_id = str(event["id"])
        try:
            latest_analysis = await fetchrow("""
                SELECT recovery_history FROM analyses 
                WHERE event_id = $1::uuid AND status = 'complete' 
                ORDER BY created_at DESC LIMIT 1
            """, event_id)
            
            if not latest_analysis:
                continue
            
            # In production: check Sentinel Hub catalog for new passes
            # For now, mock a recovery snapshot
            await _append_recovery_snapshot(event_id, latest_analysis)
            
        except Exception as e:
            logger.error(f"Recovery check failed for event {event_id}: {e}")

async def _append_recovery_snapshot(event_id: str, analysis):
    """Compute and append a recovery snapshot."""
    recovery_history = analysis.get("recovery_history") or []
    if isinstance(recovery_history, str):
        recovery_history = json.loads(recovery_history)
    
    if not recovery_history:
        return
    
    last = recovery_history[-1] if recovery_history else {}
    
    # Compute recovery score (mock: improves by 5-10% per new snapshot)
    import random
    last_score = last.get("recovery_score", 0)
    if last_score < 95:
        new_score = min(100, last_score + random.uniform(3, 9))
        new_high_km2 = last.get("high_severity_km2", 50) * (1 - (new_score - last_score) / 100)
        
        snapshot = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "high_severity_km2": round(new_high_km2, 2),
            "total_affected_km2": last.get("total_affected_km2", 142),
            "recovery_score": round(new_score, 1),
            "flood_extent_km2": None,
            "pass_id": None
        }
        
        recovery_history.append(snapshot)
        
        # Check for worsening (anomaly)
        if new_score < last_score:
            await execute("""
                INSERT INTO alert_log (event_id, alert_type, severity, message, metadata)
                VALUES ($1::uuid, 'severity_escalation', 'critical', $2, $3::jsonb)
            """, event_id, 
            f"Damage worsening detected: recovery score dropped from {last_score:.1f}% to {new_score:.1f}%",
            json.dumps({"before": last_score, "after": new_score}))
        
        await execute("""
            UPDATE analyses SET recovery_history = $1::jsonb
            WHERE event_id = $2::uuid AND status = 'complete'
        """, json.dumps(recovery_history), event_id)
