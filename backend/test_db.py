import os
import pg8000.native
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("NEON_DATABASE_URL", "postgresql://user:password@host/db?sslmode=require")
try:
    conn = pg8000.native.Connection(
        user=url.split('://')[1].split(':')[0],
        password=url.split(':')[2].split('@')[0],
        host=url.split('@')[1].split('/')[0],
        port=5432,
        database=url.split('/')[3].split('?')[0],
        ssl_context=True
    )

    print("--- CONNECTED TO NEON ---")

    # Check for tables
    tables = conn.run("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'")
    print(f"TABLES FOUND ({len(tables)}):")
    for t in tables:
        print(f" - {t[0]}")

    # Check for functions
    funcs = conn.run("SELECT proname FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE nspname = 'public'")
    print(f"\nFUNCTIONS FOUND ({len(funcs)}):")
    for f in funcs:
        print(f" - {f[0]}")
        
    # Check for triggers
    triggers = conn.run("SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_%'")
    print(f"\nTRIGGERS FOUND ({len(triggers)}):")
    for tr in triggers:
        print(f" - {tr[0]}")

except Exception as e:
    print(f"Error: {e}")
