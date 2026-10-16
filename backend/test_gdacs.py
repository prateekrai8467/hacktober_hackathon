import asyncio
from dotenv import load_dotenv
load_dotenv()

from shared.db import init_db_pool, close_db_pool
from modules.event_monitor.service import poll_gdacs

async def manual_trigger():
    await init_db_pool()
    print("Triggering GDACS Poll manually...")
    await poll_gdacs()
    print("Poll complete! Check your dashboard.")
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(manual_trigger())
