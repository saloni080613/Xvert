from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Xvert API",
    description="Universal File Bridge — conversion service API",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.middleware.api_auth import ApiKeyMiddleware
app.add_middleware(ApiKeyMiddleware)

@app.get("/")
async def root():
    return {"message": "Welcome to Xvert API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# --- ROUTERS ---

from app.routers import convert
app.include_router(convert.router, prefix="/api/convert", tags=["conversion"])

from app.routers import api_keys, public_api
app.include_router(api_keys.router, prefix="/api", tags=["API Keys"])
app.include_router(public_api.router, tags=["Public API"])

from app.routers import documents
app.include_router(documents.router, prefix="/api", tags=["documents"])

from app.routers import history
app.include_router(history.router, prefix="/api/history", tags=["history"])

from app.routers import batch
app.include_router(batch.router, prefix="/api/batch", tags=["batch-conversion"])