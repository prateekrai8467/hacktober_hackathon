"""Event Monitor — polls GDACS, USGS, NASA EONET for disaster events."""
import os
import hashlib
import logging
from datetime import datetime, timezone, timedelta
import httpx
import feedparser
from shared.db import fetch, fetchrow, execute

logger = logging.getLogger(__name__)

GDACS_RSS = "https://www.gdacs.org/xml/rss.xml"
USGS_API = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_week.geojson"
EONET_API = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50"

EVENT_TYPE_MAP = {
    "EQ": "EQ", "earthquake": "EQ",
    "FL": "FL", "flood": "FL",
    "TC": "TC", "tropical cyclone": "TC", "cyclone": "TC",
    "WF": "WF", "wildfire": "WF", "fire": "WF",
    "VO": "VO", "volcano": "VO",
    "LS": "LS", "landslide": "LS",
}

async def poll_gdacs():
    """Poll GDACS RSS feed every 10 minutes."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(GDACS_RSS)
            resp.raise_for_status()
        
        feed = feedparser.parse(resp.text)
        count = 0
        for entry in feed.entries:
            try:
                await _upsert_gdacs_event(entry)
                count += 1
            except Exception as e:
                logger.error(f"Error processing GDACS entry {entry.get('id', '?')}: {e}")
        
        logger.info(f"GDACS poll: processed {count} events")
        
        # Broadcast update to connected clients
        if count > 0:
            from shared.ws import manager
            from modules.event_monitor.router import list_events
            events_data = await list_events()
            await manager.broadcast("events_update", events_data)
            
    except Exception as e:
        logger.error(f"GDACS poll failed: {e}")

async def _upsert_gdacs_event(entry):
    gdacs_id = entry.get("gdacs_eventid", entry.get("id", ""))
    if not gdacs_id:
        return
    
    # Parse severity
    alert = entry.get("gdacs_alertlevel", "green").lower()
    if alert not in ("orange", "red"):
        return  # Only track Orange/Red alerts
    
    # Parse event type
    raw_type = entry.get("gdacs_eventtype", "OTHER").upper()
    event_type = raw_type if raw_type in ("EQ","FL","TC","WF","VO","LS") else "OTHER"
    
    # Parse coordinates
    geo = entry.get("where", {})
    lat = float(getattr(geo, 'latitude', 0) or entry.get("geo_lat", 0))
    lon = float(getattr(geo, 'longitude', 0) or entry.get("geo_lon", 0))
    
    title = entry.get("title", "Unknown Event")
    country = entry.get("gdacs_country", "")
    
    raw_pop = entry.get("gdacs_population", 0)
    try:
        if isinstance(raw_pop, dict):
            population = int(raw_pop.get("value", 0))
        else:
            population = int(raw_pop or 0)
    except (ValueError, TypeError):
        population = 0
    
    # Check if event already exists
    existing = await fetchrow("SELECT id FROM events WHERE gdacs_id = $1", gdacs_id)
    
    if existing:
        await execute(
            "UPDATE events SET last_seen_in_feed = now(), active = true WHERE gdacs_id = $1",
            gdacs_id
        )
    else:
        await execute("""
            INSERT INTO events (gdacs_id, title, event_type, severity, lat, lon, 
                                event_date, country, affected_population, last_seen_in_feed)
            VALUES ($1, $2, $3, $4, $5, $6, now(), $7, $8, now())
            ON CONFLICT (gdacs_id) DO UPDATE SET last_seen_in_feed = now(), active = true
        """, gdacs_id, title, event_type, alert, lat, lon, country, population)
        logger.info(f"New event added: {title} ({event_type}, {alert})")

async def poll_usgs():
    """Poll USGS Earthquake API every 5 minutes for M5.0+ events."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(USGS_API)
            resp.raise_for_status()
        
        data = resp.json()
        for feature in data.get("features", []):
            try:
                await _upsert_usgs_event(feature)
            except Exception as e:
                logger.error(f"Error processing USGS event: {e}")
        
        logger.info(f"USGS poll: processed {len(data.get('features', []))} earthquakes")
    except Exception as e:
        logger.error(f"USGS poll failed: {e}")

async def _upsert_usgs_event(feature):
    props = feature.get("properties", {})
    usgs_id = feature.get("id", "")
    if not usgs_id:
        return
    
    mag = props.get("mag", 0) or 0
    if mag < 5.0:
        return
    
    coords = feature.get("geometry", {}).get("coordinates", [0, 0, 0])
    lon, lat = float(coords[0]), float(coords[1])
    title = props.get("title", f"M{mag} Earthquake")
    place = props.get("place", "")
    time_ms = props.get("time", 0)
    event_time = datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc) if time_ms else datetime.now(timezone.utc)
    
    severity = "red" if mag >= 7.0 else "orange" if mag >= 5.5 else "orange"
    
    await execute("""
        INSERT INTO events (usgs_id, gdacs_id, title, event_type, severity, lat, lon, event_date, last_seen_in_feed)
        VALUES ($1, $2, $3, 'EQ', $4, $5, $6, $7, now())
        ON CONFLICT (usgs_id) DO UPDATE SET last_seen_in_feed = now(), active = true
    """, usgs_id, f"usgs_{usgs_id}", title, severity, lat, lon, event_time)

async def poll_eonet():
    """Poll NASA EONET for volcanic, landslide, storm events."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(EONET_API)
            resp.raise_for_status()
        data = resp.json()
        for event in data.get("events", []):
            try:
                await _upsert_eonet_event(event)
            except Exception as e:
                logger.error(f"EONET event error: {e}")
        logger.info(f"EONET poll: {len(data.get('events', []))} events")
    except Exception as e:
        logger.error(f"EONET poll failed: {e}")

async def _upsert_eonet_event(event):
    eonet_id = event.get("id", "")
    title = event.get("title", "")
    categories = event.get("categories", [])
    
    type_map = {"Volcanoes": "VO", "Landslides": "LS", "Severe Storms": "TC", "Wildfires": "WF"}
    event_type = "OTHER"
    for cat in categories:
        if cat.get("title") in type_map:
            event_type = type_map[cat["title"]]
            break
    
    geometries = event.get("geometry", [])
    if not geometries:
        return
    latest = geometries[-1]
    coords = latest.get("coordinates", [0, 0])
    lon, lat = float(coords[0]), float(coords[1])
    
    await execute("""
        INSERT INTO events (gdacs_id, title, event_type, severity, lat, lon, event_date, last_seen_in_feed)
        VALUES ($1, $2, $3, 'orange', $4, $5, now(), now())
        ON CONFLICT (gdacs_id) DO UPDATE SET last_seen_in_feed = now(), active = true
    """, f"eonet_{eonet_id}", title, event_type, lat, lon)

async def deactivate_old_events():
    """Mark events not seen in GDACS feed for 72h as inactive."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=72)
    result = await execute(
        "UPDATE events SET active = false WHERE last_seen_in_feed < $1 AND active = true",
        cutoff
    )
    logger.info(f"Deactivated old events: {result}")
