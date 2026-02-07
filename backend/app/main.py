from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="FileForge API",
    description="File conversion service API",
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

@app.get("/")
async def root():
    return {"message": "Welcome to FileForge API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# --- ROUTERS ---

from app.routers import convert
app.include_router(convert.router, prefix="/api/convert", tags=["conversion"])

# 2. Your Router (Documents & PDF Tools)
from app.routers import documents
app.include_router(documents.router, prefix="/api", tags=["documents"])

# Uncomment as you build more routers:
# from app.routers import files, share
# app.include_router(files.router, prefix="/api/files", tags=["files"])
# app.include_router(share.router, prefix="/api/share", tags=["sharing"])