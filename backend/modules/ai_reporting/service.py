"""AI Reporting — generates Groq LLM reports + Gemini Vision analysis."""
import os
import json
import logging
import time
import random
import string
from datetime import datetime, timezone

import httpx
from shared.db import fetch, fetchrow, execute
from shared.quota import check_gemini_quota, record_gemini_call

logger = logging.getLogger(__name__)

def _generate_slug() -> str:
    """Generate a 3-word public slug like 'delta-sierra-seven'."""
    words_a = ["alpha","bravo","delta","echo","foxtrot","golf","hotel","india","juliet","kilo"]
    words_b = ["sierra","tango","uniform","victor","whiskey","xray","yankee","zulu","lima","mike"]
    words_c = ["one","two","three","seven","eight","nine","zero","prime","base","core"]
    return f"{random.choice(words_a)}-{random.choice(words_b)}-{random.choice(words_c)}"

async def generate_report(analysis_id: str):
    """Generate AI situation report for a completed analysis."""
    analysis = await fetchrow("SELECT * FROM analyses WHERE id = $1::uuid", analysis_id)
    if not analysis:
        logger.error(f"Analysis {analysis_id} not found")
        return
    
    event = await fetchrow("SELECT * FROM events WHERE id = $1::uuid", analysis["event_id"])
    stats = analysis.get("stats") or {}
    infra = analysis.get("infrastructure") or {}
    pop = analysis.get("population") or {}
    
    # Try Groq API
    report = await _call_groq(event, stats, infra, pop)
    
    # Try Gemini Vision (if quota allows)
    gemini_desc = None
    if await check_gemini_quota():
        gemini_desc = await _call_gemini_vision(
            analysis.get("pre_thumbnail_url"),
            analysis.get("post_thumbnail_url")
        )
        await record_gemini_call()
    else:
        gemini_desc = "Gemini Vision daily quota reached — visual analysis not available for this assessment."
    
    if report:
        report["gemini_visual_description"] = gemini_desc
        report["generated_at"] = datetime.now(timezone.utc).isoformat()
    
    slug = _generate_slug()
    
    await execute("""
        UPDATE analyses SET
            report = $1::jsonb,
            public_slug = $2,
            report_status = 'complete'
        WHERE id = $3::uuid
    """, json.dumps(report), slug, analysis_id)
    
    logger.info(f"Report generated for {analysis_id}, slug: {slug}")

async def _call_groq(event, stats, infra, pop) -> dict:
    """Call Groq API with llama-3.1-70b-versatile."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set — using mock report")
        return _mock_report(event, stats)
    
    prompt = f"""You are a disaster intelligence analyst. Generate a structured JSON situation report.

Event: {event.get('title', 'Unknown')}
Type: {event.get('event_type')}
Severity: {event.get('severity')}
Location: {event.get('country')} ({event.get('lat')}, {event.get('lon')})

Damage Statistics:
- Affected area: {stats.get('area_km2', 'N/A')} km²
- High severity: {stats.get('high_severity_pct', 'N/A')}%
- Buildings assessed: {stats.get('buildings_assessed', 'N/A')}
- Destroyed: {stats.get('destroyed_count', 'N/A')}
- Population affected: {pop.get('total_affected', 'N/A')}

Infrastructure at risk:
- Hospitals: {infra.get('hospitals_at_risk', 0)}
- Bridges: {infra.get('bridges_compromised', 0)}
- Power stations: {infra.get('power_stations_offline', 0)}

Return ONLY valid JSON with these exact keys:
{{
  "executive_summary": "3 sentences max",
  "critical_infrastructure": ["list of at-risk facilities"],
  "priority_zones": [{{"name": "zone", "lat": 0.0, "lon": 0.0, "recommendation": "action"}}],
  "resource_recommendations": ["specific teams and quantities"],
  "confidence_note": "what limits this assessment",
  "next_assessment_actions": ["list of follow-up actions"]
}}"""
    
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "llama-3.1-70b-versatile",
                        "temperature": 0.1,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
                # Parse JSON from response
                start = content.find("{")
                end = content.rfind("}") + 1
                return json.loads(content[start:end])
        except Exception as e:
            wait = 2 ** attempt
            logger.warning(f"Groq attempt {attempt+1} failed: {e}. Retrying in {wait}s")
            await asyncio.sleep(wait)
    
    return _mock_report(event, stats)

async def _call_gemini_vision(pre_url: str, post_url: str) -> str:
    """Call Gemini Vision to analyze before/after imagery."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not pre_url or not post_url:
        return "Visual analysis not available — configure GEMINI_API_KEY in SENTINEL_API_KEYS.env"
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        response = model.generate_content([
            f"Analyze these before/after disaster satellite images. Pre-event: {pre_url}, Post-event: {post_url}. "
            "Describe: 1) Visible damage, 2) Structural collapse evidence, 3) Flood extent if applicable, "
            "4) Infrastructure impact, 5) Your confidence level (0-100%). Keep response under 150 words."
        ])
        return response.text
    except Exception as e:
        logger.error(f"Gemini Vision failed: {e}")
        return f"Visual analysis unavailable: {str(e)[:100]}"

def _mock_report(event, stats) -> dict:
    """Mock report for demo/development mode."""
    title = event.get("title", "Unknown Event") if event else "Unknown Event"
    return {
        "executive_summary": f"Satellite assessment of {title} indicates significant damage across the affected area. "
                             f"Approximately {stats.get('area_km2', 142)} km² affected with "
                             f"{stats.get('high_severity_pct', 28)}% classified as high severity. "
                             "Immediate deployment of search and rescue teams is recommended for priority zones.",
        "critical_infrastructure": [
            "District Hospital — within high severity zone, operational status unconfirmed",
            "Main highway bridge — moderate damage zone, structural assessment required",
            "Regional power substation — at risk, may affect 45,000 residents",
        ],
        "priority_zones": [
            {"name": "Zone Alpha", "lat": event.get("lat", 0) + 0.01 if event else 0, 
             "lon": event.get("lon", 0) + 0.01 if event else 0, 
             "recommendation": "Deploy 2 NDRF teams immediately — highest density of destroyed structures"},
            {"name": "Zone Beta", "lat": event.get("lat", 0) - 0.02 if event else 0, 
             "lon": event.get("lon", 0) + 0.015 if event else 0, 
             "recommendation": "Medical support needed — hospital access compromised"},
        ],
        "resource_recommendations": [
            "4 NDRF rescue teams with cutting equipment for collapsed structures",
            "2 medical field hospitals (200-bed capacity each)",
            "Water purification units for minimum 50,000 persons",
            "Emergency power generators for 3 district hospitals",
        ],
        "confidence_note": "Assessment based on simulated satellite data. Real Sentinel Hub keys needed for live imagery. Ground truth reports will improve accuracy.",
        "next_assessment_actions": [
            "Deploy field teams to disputed zones for verification",
            "Acquire next Sentinel-2 pass in 3-5 days for recovery tracking",
            "Cross-reference with NDRF ground reports",
        ]
    }

import asyncio  # needed for sleep in retry logic
