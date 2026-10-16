"""Alerts Engine — watches thresholds and logs alerts."""
import json
import logging
from datetime import datetime, timezone
from shared.db import fetch, fetchrow, execute

logger = logging.getLogger(__name__)

async def run_alert_watchers():
    """Main alert loop — checks all threshold conditions."""
    initial_count = await fetchrow("SELECT COUNT(*) as c FROM alert_log WHERE acknowledged = false")
    c1 = initial_count["c"] if initial_count else 0
    
    await _watch_critical_events()
    await _watch_infrastructure_at_risk()
    await _watch_high_disputes()
    
    final_count = await fetchrow("SELECT COUNT(*) as c FROM alert_log WHERE acknowledged = false")
    c2 = final_count["c"] if final_count else 0
    
    if c2 > c1:
        # New alerts generated, broadcast to clients
        from shared.ws import manager
        from modules.alerts_engine.router import list_alerts
        alerts_data = await list_alerts()
        await manager.broadcast("alerts_update", alerts_data)

async def _watch_critical_events():
    """Alert on new Red severity events."""
    rows = await fetch("""
        SELECT e.id, e.title, e.event_type, e.severity 
        FROM events e
        WHERE e.severity = 'red' AND e.active = true
        AND NOT EXISTS (
            SELECT 1 FROM alert_log al 
            WHERE al.event_id = e.id AND al.alert_type = 'new_critical_event'
            AND al.created_at > now() - interval '24 hours'
        )
    """)
    
    for event in rows:
        await execute("""
            INSERT INTO alert_log (event_id, alert_type, severity, message, metadata)
            VALUES ($1, 'new_critical_event', 'critical', $2, $3::jsonb)
        """, event["id"],
        f"🔴 CRITICAL EVENT: {event['title']} — Red alert {event['event_type']} event detected",
        json.dumps({"event_title": event["title"], "event_type": event["event_type"]}))
        logger.info(f"Alert: new critical event {event['title']}")

async def _watch_infrastructure_at_risk():
    """Alert on hospitals/bridges in high danger zones."""
    rows = await fetch("""
        SELECT ir.event_id, ir.facility_type, ir.name, ir.risk_level, e.title
        FROM infrastructure_risk ir
        JOIN events e ON e.id = ir.event_id
        WHERE ir.risk_level IN ('critical', 'high')
        AND NOT EXISTS (
            SELECT 1 FROM alert_log al 
            WHERE al.event_id = ir.event_id 
            AND al.alert_type = 'infrastructure_at_risk'
            AND al.metadata->>'facility_name' = ir.name
            AND al.created_at > now() - interval '6 hours'
        )
        LIMIT 10
    """)
    
    for row in rows:
        facility = row["name"] or row["facility_type"]
        await execute("""
            INSERT INTO alert_log (event_id, alert_type, severity, message, metadata)
            VALUES ($1, 'infrastructure_at_risk', 'critical', $2, $3::jsonb)
        """, row["event_id"],
        f"⚠️ {row['facility_type'].upper()} AT RISK: {facility} — {row['risk_level']} damage zone ({row['title']})",
        json.dumps({"facility_name": row["name"], "facility_type": row["facility_type"], "risk_level": row["risk_level"]}))

async def _watch_high_disputes():
    """Alert when 5+ disputed reports exist for same location."""
    rows = await fetch("""
        WITH disputed_counts AS (
            SELECT event_id, COUNT(*) as cnt
            FROM ground_reports
            WHERE disputed = true
            GROUP BY event_id
            HAVING COUNT(*) >= 5
        )
        SELECT dc.event_id, dc.cnt
        FROM disputed_counts dc
        WHERE NOT EXISTS (
            SELECT 1 FROM alert_log al 
            WHERE al.event_id = dc.event_id
            AND al.alert_type = 'high_dispute_density'
            AND al.created_at > now() - interval '12 hours'
        )
    """)
    
    for row in rows:
        await execute("""
            INSERT INTO alert_log (event_id, alert_type, severity, message, metadata)
            VALUES ($1, 'high_dispute_density', 'warning', $2, $3::jsonb)
        """, row["event_id"],
        f"🔍 HIGH DISPUTE DENSITY: {row['cnt']} field reports disagree with satellite assessment — field verification recommended",
        json.dumps({"dispute_count": row["cnt"]}))
