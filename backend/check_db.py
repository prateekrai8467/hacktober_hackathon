"""Check database tables and schema."""
import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def check_database():
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        print("ERROR: NEON_DATABASE_URL not set")
        return
    
    conn = await asyncpg.connect(db_url)
    
    # List all tables
    tables = await conn.fetch("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    
    print("=== TABLES IN DATABASE ===")
    for t in tables:
        print(f"  - {t['table_name']}")
    
    # Check row counts
    print("\n=== ROW COUNTS ===")
    for t in tables:
        name = t['table_name']
        try:
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {name}")
            print(f"  {name}: {count} rows")
        except Exception as e:
            print(f"  {name}: ERROR - {e}")
    
    # Check required tables for each module
    required = {
        "events": "Event Monitor",
        "analyses": "Satellite Pipeline",
        "satellite_passes": "Satellite Ops",
        "building_damage": "Damage Intelligence",
        "ground_reports": "Ground Truth",
        "infrastructure_risk": "Infrastructure Risk",
        "alert_log": "Alerts Engine",
        "osm_cache": "OSM Cache"
    }
    
    existing = {t['table_name'] for t in tables}
    
    print("\n=== MODULE TABLE CHECK ===")
    all_good = True
    for table, module in required.items():
        if table in existing:
            print(f"  [OK] {table} -> {module}")
        else:
            print(f"  [MISSING] {table} -> {module}")
            all_good = False
    
    if all_good:
        print("\n[SUCCESS] All required tables exist!")
    else:
        print("\n[WARNING] Some tables are missing. Run db_setup.py again.")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_database())
