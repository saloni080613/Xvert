# ---------------------------------------------------------------------------
# Xvert Backend — Dockerfile
# Target: Render (Linux, amd64)
# ---------------------------------------------------------------------------
# Build context should be the `backend/` directory.
#   docker build -t xvert-backend .
#   docker run -p 10000:10000 --env-file .env xvert-backend
# ---------------------------------------------------------------------------

FROM python:3.10-slim

# ── System metadata ──────────────────────────────────────────────────────────
LABEL maintainer="Xvert"
LABEL description="Xvert FastAPI backend — file conversion service"

# ── Environment ──────────────────────────────────────────────────────────────
# Prevents .pyc files and ensures stdout/stderr are unbuffered (better Render logs)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Render requires the app to listen on port 10000 by default.
# You can override this in the Render dashboard (Start Command).
ENV PORT=10000

# ── System packages ──────────────────────────────────────────────────────────
# tesseract-ocr          → OCR engine used by pytesseract
# libtesseract-dev       → Tesseract development headers (needed by some bindings)
# tesseract-ocr-eng      → English language pack for Tesseract
# libgl1                 → OpenGL library required by PyMuPDF (fitz)
# libglib2.0-0           → GLib required by PyMuPDF
# poppler-utils          → PDF utilities (pdfinfo, pdftotext) used by pdf2docx
# libreoffice            → Headless document converter (replaces docx2pdf/Word on Linux)
# --no-install-recommends keeps the image lean
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    libreoffice \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Python dependencies ───────────────────────────────────────────────────────
# Copy requirements first to leverage Docker layer caching.
# If requirements.txt hasn't changed, pip install is skipped on rebuild.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY . .

# ── Port ─────────────────────────────────────────────────────────────────────
EXPOSE 10000

# ── Start command ─────────────────────────────────────────────────────────────
# Render sets PORT automatically; we read it with the shell form so $PORT expands.
# --workers 1  keeps memory usage low on Render's free tier.
# Increase to 2-4 on paid plans.
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --timeout-keep-alive 75