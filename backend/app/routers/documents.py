"""
Documents Router
================
Handles document conversion (PDF↔DOCX, Image→PDF, PDF→Image), PDF merge, and OCR.
Integrates with Supabase Storage and conversion history for authenticated users.
"""

from fastapi import APIRouter, Response, UploadFile, File, Form, HTTPException, Request
import asyncio
import os
from app.utils.file_utils import save_to_history, sanitize_filename, fetch_cloud_file, validate_file_size
from fastapi.responses import FileResponse
from typing import List, Optional

from app.services.document_converter import convert_document, merge_pdfs
from app.services.ocr_service import perform_ocr_and_convert
from app.utils.auth import get_optional_user
from app.config import settings,    GOOGLE_VISION_ENABLED
from app.services.storage_service import upload_file, BUCKET_ORIGINALS, BUCKET_CONVERTED
from app.services.conversion_history_service import (
    create_conversion_record,
    complete_conversion,
    fail_conversion,
    increment_user_stats,
)
from typing import List, Optional
from fastapi import File, Form, UploadFile, Request, HTTPException

router = APIRouter()


@router.post("/convert/document")
async def convert_document_endpoint(
    request: Request,
    source_format: str = Form(...),
    target_format: str = Form(...),
    file: Optional[UploadFile] = File(None),
    cloud_url: Optional[str] = Form(None),
    filename: Optional[str] = Form(None),
    page_range: Optional[str] = Form(None, description="Pages to extract (e.g., '1-3' or '2,4')"),
    compress: bool = Form(False, description="Apply heavy compression to output PDF")
):
    user_id = await get_optional_user(request)

    # Ensure file or cloud_url is provided
    if not file and not cloud_url:
        raise HTTPException(status_code=400, detail="Must provide either file or cloud_url")
        
    if cloud_url:
        file = fetch_cloud_file(cloud_url, filename or "cloud_document")

    # Read file bytes for storage upload (before passing to converter)
    file_bytes = await file.read()

    # --- Supabase: create pending record + upload original ---
    conversion_id = None
    if user_id:
        conversion_id = create_conversion_record(
            user_id=user_id,
            original_filename=file.filename or "unknown",
            original_format=source_format,
            converted_format=target_format,
            file_size_original=len(file_bytes),
        )
        original_path = upload_file(BUCKET_ORIGINALS, file_bytes, user_id, file.filename or "original")
        if conversion_id and original_path:
            from app.services.supabase_service import get_supabase
            get_supabase().table("conversions").update(
                {"original_file_url": original_path}
            ).eq("id", conversion_id).execute()

    try:
        # Use content-based conversion (absolute paths handled in document_converter)
        file_path = await convert_document(
            file_content=file_bytes, 
            filename=file.filename or "document", 
            source_format=source_format, 
            target_format=target_format,
            page_range=page_range,  # <-- ADD THIS
            compress=compress       # <-- ADD THIS
        )

        # Read converted file for storage + history
        with open(file_path, "rb") as f:
            converted_bytes = f.read()
            out_filename = sanitize_filename(os.path.basename(file_path))

        # --- Supabase: upload converted + complete record ---
        if user_id and conversion_id:
            converted_path = upload_file(BUCKET_CONVERTED, converted_bytes, user_id, out_filename)
            if converted_path:
                complete_conversion(conversion_id, converted_path, len(converted_bytes))
                increment_user_stats(user_id, len(converted_bytes))
        else:
            save_to_history(converted_bytes, out_filename)

        return FileResponse(file_path, filename=out_filename)
    except Exception as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/convert/merge")
async def merge_documents_endpoint(
    request: Request,
    files: List[UploadFile] = File(default=[]),   # <-- THE FIX
    cloud_urls: List[str] = Form(default=[]),         # Added explicit default keyword
    filenames: List[str] = Form(default=[])           # Added explicit default keyword
):
    # --- Auth (optional) ---
    user_id = await get_optional_user(request)

    # --- Supabase: create pending record ---
    conversion_id = None
    if user_id:
        # For merge, we use the first file's name as original
        
        # Calculate lengths safely since files could be None
        files_count = len(files) if files else 0
        urls_count = len(cloud_urls) if cloud_urls else 0
        
        conversion_id = create_conversion_record(
            user_id=user_id,
            original_filename=f"merge_{files_count + urls_count}_files",
            original_format="pdf",
            converted_format="pdf",
            file_size_original=0,  # We don't know total size upfront
        )

    try:
        # This will now correctly evaluate to an empty list if files is None
        all_files = list(files) if files else []
        
        # Download cloud files
        if cloud_urls:
            for i, url in enumerate(cloud_urls):
                fname = filenames[i] if i < len(filenames) else f"cloud_merge_{i}.pdf"
                all_files.append(fetch_cloud_file(url, fname))
                
        if len(all_files) < 2:
            raise HTTPException(status_code=400, detail="Must provide at least 2 files to merge")
            
        file_path = await merge_pdfs(all_files)
        
        # Read merged file
        with open(file_path, "rb") as f:
            converted_bytes = f.read()
            filename = "merged_output.pdf"

        # --- Supabase: upload converted + complete record ---
        if user_id and conversion_id:
            converted_path = upload_file(BUCKET_CONVERTED, converted_bytes, user_id, filename)
            if converted_path:
                complete_conversion(conversion_id, converted_path, len(converted_bytes))
                increment_user_stats(user_id, len(converted_bytes))
        else:
            save_to_history(converted_bytes, filename)

        return FileResponse(file_path, filename="merged_output.pdf")
    except Exception as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────
# REPLACE or ADD this endpoint — matches your existing pattern
# ─────────────────────────────────────────────────────────────────

@router.post("/ocr")
async def ocr_to_docx(
    request: Request,
    file: UploadFile = File(...),
):
    # ── Step 1: Auth (identical to your pattern) ─────────────────
    user_id = await get_optional_user(request)

    # ── Step 2: Validate ─────────────────────────────────────────
    SUPPORTED_TYPES = {
        "application/pdf",
        "image/png", "image/jpeg",
        "image/tiff", "image/webp", "image/bmp",
    }
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported type: {file.content_type}. Supported: PDF, PNG, JPG, TIFF, WEBP, BMP"
        )

    file_bytes = await file.read()
    if not validate_file_size(len(file_bytes), settings.MAX_FILE_SIZE):
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413, detail=f"File too large. Maximum size is {max_mb:.0f}MB."
        )

    #  Step 3: Supabase pre-processing (MATCHES YOUR REAL PATTERN) ──
    conversion_id = None
    original_path = None

    if user_id:
        # NOT awaited — matches your synchronous create_conversion_record
        conversion_id = create_conversion_record(
            user_id=user_id,
            original_filename=file.filename or "unknown",
            original_format=file.content_type,          # e.g. "image/png"
            converted_format="docx",
            file_size_original=len(file_bytes),         # ← was missing
        )

        # Same upload_file signature as your code
        original_path = upload_file(
            BUCKET_ORIGINALS,
            file_bytes,
            user_id,
            file.filename or "original"
        )

        # ← This extra update step I missed before
        if conversion_id and original_path:
            from app.services.supabase_service import get_supabase
            get_supabase().table("conversions").update(
                {"original_file_url": original_path}
            ).eq("id", conversion_id).execute()

    # ── Step 4: Run OCR in background thread (CPU-bound) ─────────
    try:
        docx_bytes, output_filename = await asyncio.to_thread(
            perform_ocr_and_convert,
            file_bytes,
            file.filename or "document",
            file.content_type,
        )

        # ── Step 5: Post-processing (MATCHES YOUR REAL PATTERN) ──
        if user_id and conversion_id:
            converted_path = upload_file(
                BUCKET_CONVERTED,
                docx_bytes,
                user_id,
                output_filename
            )
            if converted_path:
                # Same complete_conversion signature as your code
                complete_conversion(
                    conversion_id,
                    converted_path,
                    len(docx_bytes)          # ← was missing file size
                )
                # Same increment_user_stats signature as your code
                increment_user_stats(user_id, len(docx_bytes))
        else:
            # ← Guest fallback — was completely missing before
            save_to_history(docx_bytes, output_filename)

        # ── Step 6: Return file ───────────────────────────────────
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument"
                       ".wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"',
            "X-OCR-Engine": "google-vision" if GOOGLE_VISION_ENABLED else "tesseract",
            },
        )

    except Exception as e:
        # ← Now matches your pattern exactly
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))