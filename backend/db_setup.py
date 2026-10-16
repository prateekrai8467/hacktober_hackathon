"""Database Setup Script — run this once to initialize Neon DB."""
import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def setup_database():
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        print("ERROR: NEON_DATABASE_URL is not set.")
        print("Please configure terra/SENTINEL_API_KEYS.env, rename it to .env, and try again.")
        return

    print(f"Connecting to database...")
    try:
        conn = await asyncpg.connect(db_url)
        print("Connected successfully. Running migrations...")
        
        # Read the schema file
        with open("migrations/001_schema.sql", "r") as f:
            schema = f.read()
            
        # Execute the full schema
        await conn.execute(schema)
        print("Migrations executed successfully!")
        
        await conn.close()
    except Exception as e:
        print(f"Error setting up database: {e}")

if __name__ == "__main__":
    asyncio.run(setup_database())
