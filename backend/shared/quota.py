"""
Free tier quota guards. 
All limits tracked in the database to survive restarts.
"""
import os
from datetime import datetime, date
from shared.db import fetchval, execute

# ── Sentinel Hub ──────────────────────────────────────────────
SENTINEL_HUB_MONTHLY_LIMIT = 30_000
SENTINEL_HUB_SAFE_LIMIT = 25_000  # Stop at 83% to leave buffer

async def check_sentinel_quota() -> bool:
    """Returns True if safe to make a Sentinel Hub request."""
    month_key = date.today().strftime("%Y-%m")
    used = await fetchval(
        "SELECT COALESCE(SUM(units_used), 0) FROM sentinel_quota_log WHERE month_key = $1",
        month_key
    )
    return (used or 0) < SENTINEL_HUB_SAFE_LIMIT

async def record_sentinel_usage(units: int):
    month_key = date.today().strftime("%Y-%m")
    await execute(
        "INSERT INTO sentinel_quota_log (month_key, units_used, recorded_at) VALUES ($1, $2, now())",
        month_key, units
    )

# ── Gemini Vision ─────────────────────────────────────────────
GEMINI_DAILY_SAFE_LIMIT = 1_400  # Stop at 1,400 of 1,500

async def check_gemini_quota() -> bool:
    today = date.today().isoformat()
    used = await fetchval(
        "SELECT COALESCE(SUM(calls), 0) FROM gemini_quota_log WHERE day_key = $1",
        today
    )
    return (used or 0) < GEMINI_DAILY_SAFE_LIMIT

async def record_gemini_call():
    today = date.today().isoformat()
    await execute(
        """INSERT INTO gemini_quota_log (day_key, calls, recorded_at) 
           VALUES ($1, 1, now()) 
           ON CONFLICT (day_key) DO UPDATE SET calls = gemini_quota_log.calls + 1""",
        today
    )

async def get_quota_status() -> dict:
    """Admin endpoint: returns current free tier usage."""
    month_key = date.today().strftime("%Y-%m")
    today = date.today().isoformat()
    
    sentinel_used = await fetchval(
        "SELECT COALESCE(SUM(units_used), 0) FROM sentinel_quota_log WHERE month_key = $1",
        month_key
    ) or 0
    
    gemini_used = await fetchval(
        "SELECT COALESCE(SUM(calls), 0) FROM gemini_quota_log WHERE day_key = $1",
        today
    ) or 0
    
    return {
        "sentinel_hub": {
            "used": int(sentinel_used),
            "limit": SENTINEL_HUB_MONTHLY_LIMIT,
            "safe_limit": SENTINEL_HUB_SAFE_LIMIT,
            "pct_used": round(sentinel_used / SENTINEL_HUB_MONTHLY_LIMIT * 100, 1),
            "status": "ok" if sentinel_used < SENTINEL_HUB_SAFE_LIMIT else "quota_warning"
        },
        "gemini": {
            "used_today": int(gemini_used),
            "daily_limit": 1500,
            "safe_limit": GEMINI_DAILY_SAFE_LIMIT,
            "status": "ok" if gemini_used < GEMINI_DAILY_SAFE_LIMIT else "quota_warning"
        }
    }
