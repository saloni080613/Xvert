"""
Documents Router
================
Handles document conversion (PDF↔DOCX, Image→PDF, PDF→Image), PDF merge, and OCR.
Integrates with Supabase Storage and conversion history for authenticated users.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
import os
from app.utils.file_utils import save_to_history, sanitize_filename
from fastapi.responses import FileResponse
from typing import List
from app.services.document_converter import convert_document, merge_pdfs
from app.services.ocr_service import ocr_pdf_to_docx
from app.utils.auth import get_optional_user
from app.services.storage_service import upload_file, BUCKET_ORIGINALS, BUCKET_CONVERTED
from app.services.conversion_history_service import (
    create_conversion_record,
    complete_conversion,
    fail_conversion,
    increment_user_stats,
)


router = APIRouter()


@router.post("/convert/document")
async def convert_document_endpoint(
    request: Request,
    file: UploadFile = File(...),
    source_format: str = Form(...),
    target_format: str = Form(...)
):
    # --- Auth (optional) ---
    user_id = await get_optional_user(request)

    # Read file bytes for storage upload (before passing to converter)
    file_bytes = await file.read()
    await file.seek(0)  # Reset for the converter to read again

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
        file_path = await convert_document(file, source_format, target_format)

        # Read converted file for storage + history
        with open(file_path, "rb") as f:
            converted_bytes = f.read()
            filename = sanitize_filename(os.path.basename(file_path))

        # --- Supabase: upload converted + complete record ---
        if user_id and conversion_id:
            converted_path = upload_file(BUCKET_CONVERTED, converted_bytes, user_id, filename)
            if converted_path:
                complete_conversion(conversion_id, converted_path, len(converted_bytes))
                increment_user_stats(user_id, len(converted_bytes))
        else:
            save_to_history(converted_bytes, filename)

        return FileResponse(file_path, filename=filename)
    except Exception as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/merge")
async def merge_documents_endpoint(
    request: Request,
    files: List[UploadFile] = File(...)
):
    # --- Auth (optional) ---
    user_id = await get_optional_user(request)

    # --- Supabase: create pending record ---
    conversion_id = None
    if user_id:
        # For merge, we use the first file's name as original
        first_filename = files[0].filename if files else "unknown"
        conversion_id = create_conversion_record(
            user_id=user_id,
            original_filename=f"merge_{len(files)}_files",
            original_format="pdf",
            converted_format="pdf",
            file_size_original=0,  # We don't know total size upfront
        )

    try:
        file_path = await merge_pdfs(files)

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


@router.post("/convert/ocr")
async def ocr_endpoint(
    request: Request,
    file: UploadFile = File(...),
):
    """Extract text from a scanned PDF via OCR and return a DOCX."""
    # --- Auth (optional) ---
    user_id = await get_optional_user(request)

    file_bytes = await file.read()
    await file.seek(0)

    # --- Supabase: create pending record + upload original ---
    conversion_id = None
    if user_id:
        conversion_id = create_conversion_record(
            user_id=user_id,
            original_filename=file.filename or "unknown",
            original_format="pdf",
            converted_format="docx",
            file_size_original=len(file_bytes),
        )
        original_path = upload_file(BUCKET_ORIGINALS, file_bytes, user_id, file.filename or "original")
        if conversion_id and original_path:
            from app.services.supabase_service import get_supabase
            get_supabase().table("conversions").update(
                {"original_file_url": original_path}
            ).eq("id", conversion_id).execute()

    try:
        # Save uploaded PDF to temp dir (NOT cwd)
        import tempfile as _tf
        temp_filename = os.path.join(_tf.gettempdir(), f"xvert_ocr_{file.filename}")
        with open(temp_filename, "wb") as f:
            f.write(file_bytes)

        # Run OCR pipeline
        output_path = await ocr_pdf_to_docx(temp_filename)

        # Cleanup temp input
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        # Read converted file
        with open(output_path, "rb") as f:
            converted_bytes = f.read()
            filename = sanitize_filename(os.path.basename(output_path))

        # --- Supabase: upload converted + complete record ---
        if user_id and conversion_id:
            converted_path = upload_file(BUCKET_CONVERTED, converted_bytes, user_id, filename)
            if converted_path:
                complete_conversion(conversion_id, converted_path, len(converted_bytes))
                increment_user_stats(user_id, len(converted_bytes))
        else:
            save_to_history(converted_bytes, filename)

        return FileResponse(output_path, filename=filename)
    except Exception as e:
        # Cleanup temp file on error
        if 'temp_filename' in locals() and os.path.exists(temp_filename):
            os.remove(temp_filename)
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))