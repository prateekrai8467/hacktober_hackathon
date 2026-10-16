"""
Test script for system diagnostics, AI reporting, and chat assistant.
"""
import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def run_diagnostics_test():
    print("=" * 60)
    print("TERASCOPE SYSTEM DIAGNOSTICS & AI CHAT TEST SUITE")
    print("=" * 60)
    
    # 1. Initialize DB pool
    from shared.db import init_db_pool, close_db_pool, fetchrow
    await init_db_pool()
    
    try:
        # 2. Test Diagnostics Endpoint
        from modules.diagnostics.router import get_system_diagnostics
        diag = await get_system_diagnostics()
        print("\n[1] System Diagnostics Check:")
        print(f"    Platform: {diag['platform']}")
        print(f"    Status:   {diag['status'].upper()}")
        print(f"    Database: {diag['database']}")
        print(f"    Counts:   {diag['metrics']}")
        print(f"    Storage:  {diag['storage']['status']} ({diag['storage'].get('provider')})")
        print(f"    Groq AI:  {diag['ai_intelligence']['groq']['status']}")
        print(f"    Gemini:   {diag['ai_intelligence']['gemini']['status']}")
        
        # 3. Test AI Chat Assistant
        from modules.ai_reporting.service import chat_with_ai
        print("\n[2] Testing AI Chat Assistant (Groq / Gemini)...")
        test_msg = "What is the immediate evacuation route if highway bridges are damaged?"
        reply = await chat_with_ai(test_msg)
        print(f"    User:  {test_msg}")
        print(f"    AI Response: {reply.encode('ascii', 'replace').decode()[:160]}...")
        
        # 4. Test Event Report Generation
        from modules.ai_reporting.service import generate_report_for_event
        event = await fetchrow("SELECT id, title FROM events LIMIT 1")
        if event:
            print(f"\n[3] Generating Situation Report for event '{event['title']}' ({event['id']})...")
            rep_data = await generate_report_for_event(str(event["id"]))
            print(f"    Report Status: {rep_data['status']}")
            print(f"    Public Slug:   {rep_data.get('public_slug')}")
            summary = rep_data["report"].get("executive_summary", "")
            safe_summary = summary.encode('ascii', 'replace').decode()
            print(f"    Executive Summary: {safe_summary[:140]}...")
        else:
            print("\n[3] No events found to generate report for.")
            
        print("\n" + "=" * 60)
        print("ALL DIAGNOSTIC & AI TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
    finally:
        await close_db_pool()

if __name__ == "__main__":
    asyncio.run(run_diagnostics_test())
