"""Event Monitor — polls GDACS, USGS, NASA EONET for disaster events."""
import os
import logging
from datetime import datetime, timezone
import httpx
import feedparser
from shared.db import fetch, fetchrow, execute

logger = logging.getLogger(__name__)

GDACS_RSS = "https://www.gdacs.org/xml/rss.xml"
USGS_API = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson"
EONET_API = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50"

EVENT_TYPE_MAP = {
    "EQ": "EQ", "earthquake": "EQ",
    "FL": "FL", "flood": "FL",
    "TC": "TC", "tropical cyclone": "TC", "cyclone": "TC",
    "WF": "WF", "wildfire": "WF", "fire": "WF",
    "VO": "VO", "volcano": "VO",
    "LS": "LS", "landslide": "LS",
}

async def poll_gdacs() -> int:
    """Poll GDACS RSS feed and upsert active global alerts."""
    count = 0
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(GDACS_RSS)
            resp.raise_for_status()
        
        feed = feedparser.parse(resp.text)
        for entry in feed.entries:
            try:
                added = await _upsert_gdacs_event(entry)
                if added:
                    count += 1
            except Exception as e:
                logger.error(f"Error processing GDACS entry {entry.get('id', '?')}: {e}")
        
        logger.info(f"GDACS poll: processed {count} events")
        
        if count > 0:
            await _broadcast_updates()
            
    except Exception as e:
        logger.error(f"GDACS poll failed: {e}")
    return count

async def _upsert_gdacs_event(entry) -> bool:
    gdacs_id = entry.get("gdacs_eventid", entry.get("id", ""))
    if not gdacs_id:
        return False
    
    alert = entry.get("gdacs_alertlevel", "green").lower()
    if alert not in ("orange", "red"):
        return False
    
    raw_type = entry.get("gdacs_eventtype", "OTHER").upper()
    event_type = raw_type if raw_type in ("EQ", "FL", "TC", "WF", "VO", "LS") else "OTHER"
    
    geo = entry.get("where", {})
    lat = float(getattr(geo, 'latitude', 0) or entry.get("geo_lat", 0))
    lon = float(getattr(geo, 'longitude', 0) or entry.get("geo_lon", 0))
    if lat == 0 and lon == 0:
        return False
    
    title = entry.get("title", "Disaster Alert")
    country = entry.get("gdacs_country", "")
    
    raw_pop = entry.get("gdacs_population", 0)
    try:
        population = int(raw_pop.get("value", 0)) if isinstance(raw_pop, dict) else int(raw_pop or 0)
    except (ValueError, TypeError):
        population = 0
    
    await execute("""
        INSERT INTO events (gdacs_id, title, event_type, severity, lat, lon, 
                            event_date, country, affected_population, last_seen_in_feed)
        VALUES ($1, $2, $3::event_type_enum, $4::severity_enum, $5, $6, now(), $7, $8, now())
        ON CONFLICT (gdacs_id) DO UPDATE SET last_seen_in_feed = now(), active = true
    """, gdacs_id, title, event_type, alert, lat, lon, country, population)
    return True

async def poll_usgs() -> int:
    """Poll USGS Earthquake API for significant magnitude events."""
    count = 0
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(USGS_API)
            resp.raise_for_status()
        
        data = resp.json()
        for feature in data.get("features", []):
            try:
                added = await _upsert_usgs_event(feature)
                if added:
                    count += 1
            except Exception as e:
                logger.error(f"Error processing USGS event: {e}")
        
        logger.info(f"USGS poll: processed {count} earthquakes")
        if count > 0:
            await _broadcast_updates()
    except Exception as e:
        logger.error(f"USGS poll failed: {e}")
    return count

async def _upsert_usgs_event(feature) -> bool:
    props = feature.get("properties", {})
    usgs_id = feature.get("id", "")
    if not usgs_id:
        return False
    
    mag = float(props.get("mag", 0) or 0)
    if mag < 5.0:
        return False
    
    coords = feature.get("geometry", {}).get("coordinates", [0, 0, 0])
    lon, lat = float(coords[0]), float(coords[1])
    title = props.get("title", f"M{mag} Earthquake")
    time_ms = props.get("time", 0)
    event_time = datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc) if time_ms else datetime.now(timezone.utc)
    
    severity = "red" if mag >= 6.8 else "orange" if mag >= 5.5 else "green"
    
    await execute("""
        INSERT INTO events (usgs_id, gdacs_id, title, event_type, severity, lat, lon, event_date, last_seen_in_feed)
        VALUES ($1, $2, $3, 'EQ'::event_type_enum, $4::severity_enum, $5, $6, $7, now())
        ON CONFLICT (usgs_id) DO UPDATE SET last_seen_in_feed = now(), active = true
    """, usgs_id, f"usgs_{usgs_id}", title, severity, lat, lon, event_time)
    return True

async def seed_demo_events() -> int:
    """Seed calibrated historical and benchmark disaster events."""
    demo_events = [
        {
            "gdacs_id": "demo_turkey_eq_2023",
            "title": "Kahramanmaraş Magnitude 7.8 Earthquake",
            "event_type": "EQ",
            "severity": "red",
            "lat": 37.174,
            "lon": 37.032,
            "country": "Turkey",
            "country_code": "TUR",
            "affected_population": 13500000,
        },
        {
            "gdacs_id": "demo_hokkaido_eq",
            "title": "Hokkaido Coast Magnitude 6.7 Earthquake",
            "event_type": "EQ",
            "severity": "orange",
            "lat": 42.671,
            "lon": 142.019,
            "country": "Japan",
            "country_code": "JPN",
            "affected_population": 450000,
        },
        {
            "gdacs_id": "demo_valencia_fl_2024",
            "title": "Valencia Flash Flood Emergency",
            "event_type": "FL",
            "severity": "red",
            "lat": 39.469,
            "lon": -0.376,
            "country": "Spain",
            "country_code": "ESP",
            "affected_population": 800000,
        },
        {
            "gdacs_id": "demo_wildfire_california",
            "title": "Sierra Foothills Wildfire Complex",
            "event_type": "WF",
            "severity": "orange",
            "lat": 38.581,
            "lon": -120.987,
            "country": "United States",
            "country_code": "USA",
            "affected_population": 120000,
        }
    ]
    
    seeded = 0
    for ev in demo_events:
        await execute("""
            INSERT INTO events (gdacs_id, title, event_type, severity, lat, lon, event_date, country, country_code, affected_population, last_seen_in_feed, active)
            VALUES ($1, $2, $3::event_type_enum, $4::severity_enum, $5, $6, now(), $7, $8, $9, now(), true)
            ON CONFLICT (gdacs_id) DO UPDATE SET active = true, last_seen_in_feed = now()
        """, ev["gdacs_id"], ev["title"], ev["event_type"], ev["severity"], ev["lat"], ev["lon"], ev["country"], ev["country_code"], ev["affected_population"])
        seeded += 1
    
    return seeded

async def _broadcast_updates():
    try:
        from shared.ws import manager
        from modules.event_monitor.router import list_events
        data = await list_events()
        await manager.broadcast("events_update", data)
    except Exception as e:
        logger.debug(f"Broadcast notice: {e}")
