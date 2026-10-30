from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router
from contextlib import asynccontextmanager
from services.database import get_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Client
    get_database()
    yield

app = FastAPI(
    title="CROPIC AI API",
    description="Real-Time Crop Image Analytics for Crop Insurance",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "CROPIC Backend is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

