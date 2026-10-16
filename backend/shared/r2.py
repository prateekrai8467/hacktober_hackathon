"""
Shared file storage client — uses Supabase Storage.
Drop-in replacement for the original R2 client; same upload_bytes / get_public_url interface.
"""
import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "sentinel-media")


def _headers() -> dict:
    return {
        "apikey": _SERVICE_KEY,
        "Authorization": f"Bearer {_SERVICE_KEY}",
    }


def upload_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to Supabase Storage and return the public URL."""
    if not _SUPABASE_URL or not _SERVICE_KEY:
        logger.warning("Supabase credentials not set — returning placeholder URL")
        return f"storage://{_BUCKET}/{key}"

    url = f"{_SUPABASE_URL}/storage/v1/object/{_BUCKET}/{key}"
    headers = {**_headers(), "Content-Type": content_type}

    # Supabase uses upsert header to overwrite existing files
    headers["x-upsert"] = "true"

    try:
        resp = httpx.post(url, content=data, headers=headers, timeout=60)
        resp.raise_for_status()
        logger.info(f"Uploaded {key} to Supabase Storage ({len(data)} bytes)")
    except httpx.HTTPStatusError as e:
        logger.error(f"Supabase Storage upload failed: {e.response.status_code} — {e.response.text}")
        return f"storage://{_BUCKET}/{key}"
    except Exception as e:
        logger.error(f"Supabase Storage upload error: {e}")
        return f"storage://{_BUCKET}/{key}"

    return get_public_url(key)


def get_public_url(key: str) -> str:
    """Return the public URL for a stored file."""
    if not _SUPABASE_URL:
        return f"storage://{_BUCKET}/{key}"
    return f"{_SUPABASE_URL}/storage/v1/object/public/{_BUCKET}/{key}"
