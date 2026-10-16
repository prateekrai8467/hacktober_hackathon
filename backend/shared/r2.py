"""
Shared file storage client — supports S3 / Neon Object Storage and Supabase Storage.
Provides unified upload_bytes / get_public_url interface.
"""
import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# S3 / Neon Object Storage settings
_S3_ENDPOINT = os.getenv("AWS_ENDPOINT_URL_S3", "")
_AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
_AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
_AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
_S3_BUCKET = os.getenv("S3_BUCKET_NAME", "sentinel-media")

# Supabase fallback settings
_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
_SUPABASE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "sentinel-media")

_s3_client = None

def _get_s3_client():
    global _s3_client
    if _s3_client is None and _AWS_ACCESS_KEY_ID and _AWS_SECRET_ACCESS_KEY:
        try:
            import boto3
            _s3_client = boto3.client(
                "s3",
                endpoint_url=_S3_ENDPOINT if _S3_ENDPOINT else None,
                aws_access_key_id=_AWS_ACCESS_KEY_ID,
                aws_secret_access_key=_AWS_SECRET_ACCESS_KEY,
                region_name=_AWS_REGION,
            )
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
    return _s3_client


def _headers() -> dict:
    return {
        "apikey": _SERVICE_KEY,
        "Authorization": f"Bearer {_SERVICE_KEY}",
    }


def upload_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to S3/Neon Storage or Supabase Storage and return the public URL."""
    client = _get_s3_client()
    if client:
        try:
            client.put_object(
                Bucket=_S3_BUCKET,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
            logger.info(f"Uploaded {key} to S3/Neon Storage ({len(data)} bytes)")
            return get_public_url(key)
        except Exception as e:
            logger.error(f"S3/Neon upload error: {e}")

    # Fallback to Supabase Storage if configured
    if _SUPABASE_URL and _SERVICE_KEY:
        url = f"{_SUPABASE_URL}/storage/v1/object/{_SUPABASE_BUCKET}/{key}"
        headers = {**_headers(), "Content-Type": content_type, "x-upsert": "true"}
        try:
            resp = httpx.post(url, content=data, headers=headers, timeout=60)
            resp.raise_for_status()
            logger.info(f"Uploaded {key} to Supabase Storage ({len(data)} bytes)")
            return get_public_url(key)
        except Exception as e:
            logger.error(f"Supabase Storage upload error: {e}")

    logger.warning("No storage backend succeeded — returning placeholder URL")
    return f"storage://{_S3_BUCKET}/{key}"


def get_public_url(key: str) -> str:
    """Return public URL for stored object."""
    if _S3_ENDPOINT:
        return f"{_S3_ENDPOINT.rstrip('/')}/{_S3_BUCKET}/{key}"
    if _SUPABASE_URL:
        return f"{_SUPABASE_URL}/storage/v1/object/public/{_SUPABASE_BUCKET}/{key}"
    return f"storage://{_S3_BUCKET}/{key}"

