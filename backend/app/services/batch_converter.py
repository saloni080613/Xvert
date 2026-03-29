"""
Batch Converter Service
=======================
Handles parallel conversion of up to 20 files at once using asyncio.gather.

Architecture:
  - POST /api/batch/convert      → accept all files, create batch_id, fire-and-forget tasks
  - GET  /api/batch/progress/{id} → SSE stream of per-file progress events
  - GET  /api/batch/download/{filename} → download a converted file

Parallelism:
  Each file gets its own asyncio task via asyncio.gather().
  CPU-bound work (Pillow, Pandas, pdf2docx...) runs in a ThreadPoolExecutor
  via asyncio.to_thread(), so the event loop stays non-blocking.
"""

import asyncio
import uuid
import os
import tempfile
from typing import Dict, Any

# Imports from existing converters
from app.services.image_converter import convert_image, SUPPORTED_FORMATS as IMAGE_FORMATS
from app.services.data_converter import convert_data, SUPPORTED_DATA_FORMATS as DATA_FORMATS
from app.services.document_converter import convert_document
from app.utils.file_utils import (
    get_format_from_filename,
    get_output_filename,
    get_data_format_from_filename,
    get_data_output_filename,
    sanitize_filename,
)

# ──────────────────────────────────────────────────────────────────────────────
# Supported format sets
# ──────────────────────────────────────────────────────────────────────────────

# All formats that can be handled by the batch endpoint
IMAGE_FORMAT_SET = IMAGE_FORMATS                          # {"png","jpg","jpeg","gif"}
DATA_FORMAT_SET  = DATA_FORMATS                           # {"json","csv","xlsx","xml"}
DOC_FORMAT_SET   = {"pdf", "docx", "doc"}

# Temp dir for converted outputs
_TEMP_DIR = tempfile.gettempdir()

# ──────────────────────────────────────────────────────────────────────────────
# Shared in-memory state: batch_id → { queue, file_count }
# The queue holds dicts that become JSON SSE events.
# ──────────────────────────────────────────────────────────────────────────────
_batch_registry: Dict[str, Dict[str, Any]] = {}

MAX_FILES = 20


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def create_batch(file_list: list, target_format: str) -> str:
    """
    Register a new batch in the global registry and return its batch_id.
    file_list: [ { file_id, filename, bytes } ]
    """
    batch_id = str(uuid.uuid4())
    _batch_registry[batch_id] = {
        "queue": asyncio.Queue(),
        "file_count": len(file_list),
    }
    return batch_id


async def run_batch(batch_id: str, file_list: list, target_format: str):
    """
    Launch all file conversions in parallel using asyncio.gather().
    When all are done, push a batch_complete sentinel event.
    """
    queue: asyncio.Queue = _batch_registry[batch_id]["queue"]
    tasks = [
        _convert_one(file_info, target_format, queue)
        for file_info in file_list
    ]
    await asyncio.gather(*tasks, return_exceptions=True)
    await queue.put({"type": "batch_complete"})


def get_batch_queue(batch_id: str) -> asyncio.Queue | None:
    """Return the queue for a batch, or None if not found."""
    entry = _batch_registry.get(batch_id)
    return entry["queue"] if entry else None


def delete_batch(batch_id: str):
    """Clean up registry entry after SSE stream closes."""
    _batch_registry.pop(batch_id, None)


# ──────────────────────────────────────────────────────────────────────────────
# Internal: per-file conversion + routing
# ──────────────────────────────────────────────────────────────────────────────

async def _convert_one(file_info: dict, target_format: str, queue: asyncio.Queue):
    """
    Convert a single file and push SSE progress events.
    Detects file type automatically from extension.
    """
    file_id   = file_info["file_id"]
    filename  = file_info["filename"]
    raw_bytes = file_info["bytes"]

    # Emit: started
    await queue.put({
        "file_id":  file_id,
        "filename": filename,
        "progress": 0,
        "status":   "processing",
    })

    try:
        converted_bytes, output_filename = await _route_conversion(
            raw_bytes, filename, target_format
        )

        # Save to temp dir with a unique name
        safe_name  = sanitize_filename(output_filename)
        out_path   = os.path.join(_TEMP_DIR, f"xvert_batch_{file_id}_{safe_name}")
        with open(out_path, "wb") as f:
            f.write(converted_bytes)

        # Emit: done
        await queue.put({
            "file_id":      file_id,
            "filename":     filename,
            "progress":     100,
            "status":       "done",
            "output_name":  safe_name,
            "download_url": f"/api/batch/download/{file_id}/{safe_name}",
        })

    except Exception as exc:
        # Emit: error (never crash the gather)
        await queue.put({
            "file_id":  file_id,
            "filename": filename,
            "progress": 0,
            "status":   "error",
            "error":    str(exc),
        })


async def _route_conversion(
    raw_bytes: bytes,
    filename: str,
    target_format: str,
) -> tuple[bytes, str]:
    """
    Decide which converter to call based on source extension AND target format.
    Returns (converted_bytes, output_filename).
    """
    source_ext = os.path.splitext(filename)[1].lstrip(".").lower()
    target_format = target_format.lower()

    # ── Image → Image ──────────────────────────────────────────────────────
    if source_ext in IMAGE_FORMAT_SET and target_format in IMAGE_FORMAT_SET:
        converted_bytes, _ = await asyncio.to_thread(
            convert_image, raw_bytes, source_ext, target_format
        )
        output_filename = get_output_filename(filename, target_format)
        return converted_bytes, output_filename

    # ── Data → Data ────────────────────────────────────────────────────────
    if source_ext in DATA_FORMAT_SET and target_format in DATA_FORMAT_SET:
        converted_bytes, _, _ = await asyncio.to_thread(
            convert_data, raw_bytes, source_ext, target_format
        )
        output_filename = get_data_output_filename(filename, target_format)
        return converted_bytes, output_filename

    # ── Document / PDF conversions ─────────────────────────────────────────
    if (source_ext in DOC_FORMAT_SET or source_ext in IMAGE_FORMAT_SET) and \
       (target_format in DOC_FORMAT_SET or target_format in IMAGE_FORMAT_SET):

        # Build a minimal UploadFile-like object for document_converter
        from app.services.batch_converter_compat import BytesUploadFile  # local shim
        fake_upload = BytesUploadFile(filename=filename, content=raw_bytes)
        out_path = await convert_document(fake_upload, source_ext, target_format)

        with open(out_path, "rb") as f:
            converted_bytes = f.read()

        # Clean up temp file
        try:
            os.remove(out_path)
        except OSError:
            pass

        output_filename = os.path.basename(out_path)
        return converted_bytes, output_filename

    raise ValueError(
        f"Unsupported conversion: {source_ext} → {target_format}. "
        f"Images: {IMAGE_FORMAT_SET}, Data: {DATA_FORMAT_SET}, Docs: {DOC_FORMAT_SET}"
    )
