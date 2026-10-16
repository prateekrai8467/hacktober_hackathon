"""
TeraScope — Simple Backend Server (no ML, no DB)
Just serves the API endpoints with mock data.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TeraScope API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "service": "TeraScope API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/events")
async def get_events():
    return {"events": [], "message": "No active events (mock mode)"}

@app.get("/api/alerts")
async def get_alerts():
    return {"alerts": [], "message": "No active alerts (mock mode)"}

@app.get("/api/damage")
async def get_damage():
    return {"damage_reports": [], "message": "No damage reports (mock mode)"}

@app.get("/api/recovery")
async def get_recovery():
    return {"recovery_data": [], "message": "No recovery data (mock mode)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
