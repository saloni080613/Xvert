"""
Batch Router
============
Endpoints:
  POST   /api/batch/convert                  → accept up to 20 files, start parallel processing
  GET    /api/batch/progress/{batch_id}       → SSE stream of per-file events
  GET    /api/batch/download/{file_id}/{name} → download a converted temp file
"""

import asyncio
import json
import os
import tempfile
import uuid

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Optional

from app.services.batch_converter import (
    MAX_FILES,
    create_batch,
    delete_batch,
    get_batch_queue,
    run_batch,
)
from app.config import settings
from app.utils.auth import get_optional_user
from app.utils.file_utils import validate_file_size

router = APIRouter()
_TEMP_DIR = tempfile.gettempdir()


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/batch/convert
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/convert")
async def batch_convert(
    request: Request,
    files: List[UploadFile] = File(..., description="Up to 20 files of any supported type"),
    target_format: str = Form(..., description="Target format for ALL files (e.g. jpg, pdf, csv)"),
):
    """
    Upload up to 20 files at once for parallel conversion.

    - Reads all files immediately into memory
    - Creates a batch_id and asyncio.Queue for SSE progress
    - Fires asyncio.gather() in the background (non-blocking)
    - Returns batch_id + per-file IDs immediately

    Connect to GET /api/batch/progress/{batch_id} to stream live updates.
    """
    # ── Validate count ──────────────────────────────────────────────────────
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum allowed is {MAX_FILES}, got {len(files)}."
        )

    # ── Auth (optional) ─────────────────────────────────────────────────────
    user_id = await get_optional_user(request)

    # ── Read all file bytes immediately (before FastAPI closes the request) ─
    file_list = []
    for upload in files:
        raw = await upload.read()

        # Validate individual file size
        if not validate_file_size(len(raw), settings.MAX_FILE_SIZE):
            max_mb = settings.MAX_FILE_SIZE // (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File '{upload.filename}' exceeds maximum size of {max_mb}MB."
            )

        file_list.append({
            "file_id":  str(uuid.uuid4()),
            "filename": upload.filename or "unknown",
            "bytes":    raw,
            "user_id":  user_id,
        })

    # ── Create batch registry entry ─────────────────────────────────────────
    batch_id = create_batch(file_list, target_format)

    # ── Fire all conversions in the background (non-blocking) ───────────────
    asyncio.create_task(run_batch(batch_id, file_list, target_format))

    return {
        "batch_id":    batch_id,
        "total":       len(file_list),
        "file_ids":    [f["file_id"] for f in file_list],
        "filenames":   [f["filename"] for f in file_list],
        "target_format": target_format,
        "progress_url": f"/api/batch/progress/{batch_id}",
    }


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/batch/progress/{batch_id}  — Server-Sent Events
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/progress/{batch_id}")
async def batch_progress(batch_id: str):
    """
    Server-Sent Events stream for real-time per-file progress.

    Event types:
      { file_id, filename, progress (0|100), status ("processing"|"done"|"error") }
      { type: "batch_complete" }  ← final event, stream closes

    Connect with EventSource in the browser:
      const es = new EventSource('/api/batch/progress/<batch_id>');
      es.onmessage = (e) => { const data = JSON.parse(e.data); ... };
    """
    queue = get_batch_queue(batch_id)
    if queue is None:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    async def event_generator():
        try:
            while True:
                try:
                    # Wait for the next event (timeout so the conn stays alive)
                    event = await asyncio.wait_for(queue.get(), timeout=120)
                except asyncio.TimeoutError:
                    # Send a keep-alive comment so nginx/proxies don't kill the conn
                    yield ": keep-alive\n\n"
                    continue

                yield f"data: {json.dumps(event)}\n\n"

                if event.get("type") == "batch_complete":
                    delete_batch(batch_id)
                    break
        except asyncio.CancelledError:
            # Client disconnected — clean up
            delete_batch(batch_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":   "no-cache",
            "X-Accel-Buffering": "no",       # Disable nginx buffering
            "Connection":      "keep-alive",
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/batch/download/{file_id}/{filename}
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/download/{file_id}/{filename}")
async def batch_download(file_id: str, filename: str):
    """
    Download a converted file produced by a batch job.
    The file_id and filename are provided in the SSE 'done' event.
    """
    # Reconstruct the path that batch_converter.py used when saving
    safe_name = filename.replace("/", "").replace("..", "")  # basic traversal guard
    out_path  = os.path.join(_TEMP_DIR, f"xvert_batch_{file_id}_{safe_name}")

    if not os.path.exists(out_path):
        raise HTTPException(
            status_code=404,
            detail=f"Converted file not found. It may have been cleaned up."
        )

    return FileResponse(
        path=out_path,
        filename=safe_name,
        media_type="application/octet-stream",
    )
