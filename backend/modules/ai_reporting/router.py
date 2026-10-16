"""AI Reporting API routes."""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from shared.db import fetchrow, fetch
from modules.ai_reporting.service import generate_report

router = APIRouter(tags=["AI Reporting"])

@router.get("/reports/{analysis_id}")
async def get_report(analysis_id: str):
    row = await fetchrow("SELECT * FROM analyses WHERE id = $1::uuid", analysis_id)
    if not row:
        raise HTTPException(404, "Analysis not found")
    return {
        "id": str(row["id"]),
        "status": row["report_status"],
        "report": row["report"],
        "public_slug": row["public_slug"],
        "pdf_url": row["pdf_url"],
        "stats": row["stats"],
    }

@router.get("/reports/public/{slug}")
async def get_public_report(slug: str):
    """Public shareable report — no auth required."""
    row = await fetchrow("""
        SELECT a.*, e.title as event_title, e.event_type, e.country, e.lat, e.lon, e.event_date
        FROM analyses a
        JOIN events e ON e.id = a.event_id
        WHERE a.public_slug = $1
    """, slug)
    if not row:
        raise HTTPException(404, "Report not found")
    return {
        "event_title": row["event_title"],
        "event_type": row["event_type"],
        "country": row["country"],
        "event_date": row["event_date"].isoformat() if row["event_date"] else None,
        "stats": row["stats"],
        "report": row["report"],
        "pre_thumbnail_url": row["pre_thumbnail_url"],
        "post_thumbnail_url": row["post_thumbnail_url"],
        "generated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
    }

@router.post("/reports/{analysis_id}/regenerate")
async def regenerate_report(analysis_id: str, background_tasks: BackgroundTasks):
    """Force regenerate the AI report."""
    row = await fetchrow("SELECT id FROM analyses WHERE id = $1::uuid", analysis_id)
    if not row:
        raise HTTPException(404, "Analysis not found")
    from shared.db import execute
    await execute("UPDATE analyses SET report_status = 'pending' WHERE id = $1::uuid", analysis_id)
    background_tasks.add_task(generate_report, analysis_id)
    return {"status": "regenerating", "analysis_id": analysis_id}

@router.get("/reports/module/health")
async def reporting_health():
    groq_key = __import__("os").getenv("GROQ_API_KEY")
    gemini_key = __import__("os").getenv("GEMINI_API_KEY")
    return {
        "status": "ok",
        "module": "ai_reporting",
        "groq_configured": bool(groq_key),
        "gemini_configured": bool(gemini_key),
        "reason": "Operational" if groq_key else "No GROQ_API_KEY — using mock reports"
    }
