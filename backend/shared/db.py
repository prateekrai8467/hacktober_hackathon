from typing import Any, List, Optional
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool: Optional[asyncpg.Pool] = None

async def init_db_pool() -> asyncpg.Pool:
    """Initialize the asyncpg connection pool to the Neon PostgreSQL database."""
    global _pool
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        raise RuntimeError("NEON_DATABASE_URL is not set. Please configure terra/backend/.env")
    _pool = await asyncpg.create_pool(db_url, min_size=2, max_size=10)
    return _pool

async def get_pool() -> asyncpg.Pool:
    """Get active connection pool, initializing one if not already created."""
    global _pool
    if _pool is None:
        await init_db_pool()
    return _pool

async def close_db_pool() -> None:
    """Gracefully terminate all connections in the database pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def execute(query: str, *args: Any) -> str:
    """Execute a write or DDL statement against the pool."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)

async def fetch(query: str, *args: Any) -> List[asyncpg.Record]:
    """Fetch all matching records from the database."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)

async def fetchrow(query: str, *args: Any) -> Optional[asyncpg.Record]:
    """Fetch a single record from the database."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)

async def fetchval(query: str, *args: Any) -> Any:
    """Fetch a single scalar value from the first row of a query result."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(query, *args)
