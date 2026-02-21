"""
Convert Router - Image & Data Conversion API Endpoints
======================================================

This router handles image and data conversion requests.

API Flow:
1. Client sends POST request with file + target_format
2. Server validates the file type and size
3. Server converts using the appropriate service
4. If authenticated: uploads to Supabase Storage + saves history
5. Server returns the converted file as a downloadable response
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import Response, FileResponse
from typing import Optional, List
import os

from app.services.image_converter import (
    convert_image,
    get_mime_type,
    validate_format,
    SUPPORTED_FORMATS,
)
from app.services.data_converter import (
    convert_data,
    validate_data_format,
    get_data_content_type,
    SUPPORTED_DATA_FORMATS,
)
from app.utils.file_utils import (
    get_format_from_filename,
    get_output_filename,
    get_content_type,
    validate_file_size,
    sanitize_filename,
    get_data_format_from_filename,
    get_data_output_filename,
    save_to_history,
    HISTORY_DIR
)
from app.config import settings
from app.utils.auth import get_optional_user
from app.services.storage_service import upload_file, BUCKET_ORIGINALS, BUCKET_CONVERTED
from app.services.conversion_history_service import (
    create_conversion_record,
    complete_conversion,
    fail_conversion,
    increment_user_stats,
)


router = APIRouter()


# ---- Legacy local history (kept for backwards compat / non-auth users) ----

@router.get("/history")
async def get_history():
    """List all files in history directory"""
    try:
        if not os.path.exists(HISTORY_DIR):
            return {"files": []}

        files = []
        for filename in os.listdir(HISTORY_DIR):
            file_path = os.path.join(HISTORY_DIR, filename)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                files.append({
                    "name": filename,
                    "size": stat.st_size,
                    "created_at": stat.st_ctime,
                    "modified_at": stat.st_mtime
                })

        files.sort(key=lambda x: x["created_at"], reverse=True)
        return {"files": files}
    except Exception as e:
        return {"error": str(e), "files": []}

@router.get("/history/{filename}")
async def download_history_file(filename: str):
    """Download a specific file from history"""
    file_path = os.path.join(HISTORY_DIR, sanitize_filename(filename))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )


# =============================================================================
# IMAGE CONVERSION
# =============================================================================

@router.post("/image")
async def convert_image_endpoint(
    request: Request,
    file: UploadFile = File(..., description="Image file to convert"),
    source_format: Optional[str] = Form(
        default=None,
        description="Source format (auto-detected if not provided)"
    ),
    target_format: str = Form(
        ...,
        description="Target format: png, jpg, jpeg, or gif"
    ),
):
    """
    Convert an image to a different format.

    **Supported Formats**: PNG, JPG, JPEG, GIF

    **How it works**:
    1. Upload your image file
    2. Optionally specify the source format (auto-detected from file if omitted)
    3. Specify the target format you want
    4. Receive the converted image as a download

    **Notes**:
    - PNG → JPG: Transparency is flattened to white background
    - GIF → Other: Only first frame is converted (animations not preserved)
    - Any → GIF: Colors are reduced to 256 (GIF limitation)
    """
    # --- Auth (optional) ---
    user_id = await get_optional_user(request)

    # Validate target format
    target_format = target_format.lower()
    if not validate_format(target_format):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target format '{target_format}'. Allowed: {', '.join(SUPPORTED_FORMATS)}"
        )

    # Validate source format if provided
    if source_format:
        source_format = source_format.lower()
        if not validate_format(source_format):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source format '{source_format}'. Allowed: {', '.join(SUPPORTED_FORMATS)}"
            )

    # Auto-detect source format from filename if not provided
    if not source_format:
        source_format = get_format_from_filename(file.filename or "")
        if not source_format:
            raise HTTPException(
                status_code=400,
                detail="Could not detect source format. Please provide source_format parameter."
            )

    # Read file contents
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # Validate file size
    if not validate_file_size(len(file_bytes), settings.MAX_FILE_SIZE):
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {max_mb:.0f}MB."
        )

    # Check if source and target are the same
    if source_format == target_format or (source_format == "jpeg" and target_format == "jpg") or (source_format == "jpg" and target_format == "jpeg"):
        raise HTTPException(
            status_code=400,
            detail=f"Source and target formats are the same ({source_format}). No conversion needed."
        )

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
        # Upload original file to storage
        original_path = upload_file(BUCKET_ORIGINALS, file_bytes, user_id, file.filename or "original")
        if conversion_id and original_path:
            from app.services.supabase_service import get_supabase
            get_supabase().table("conversions").update(
                {"original_file_url": original_path}
            ).eq("id", conversion_id).execute()

    # Perform conversion
    try:
        converted_bytes, detected_format = convert_image(
            file_bytes=file_bytes,
            source_format=source_format,
            target_format=target_format,
        )
    except ValueError as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {str(e)}"
        )

    # Generate output filename
    output_filename = get_output_filename(file.filename or "converted", target_format)
    output_filename = sanitize_filename(output_filename)

    # --- Supabase: upload converted + complete record ---
    if user_id and conversion_id:
        converted_path = upload_file(BUCKET_CONVERTED, converted_bytes, user_id, output_filename)
        if converted_path:
            complete_conversion(conversion_id, converted_path, len(converted_bytes))
            increment_user_stats(user_id, len(converted_bytes))
    else:
        # Fallback: save to local history for non-auth users
        save_to_history(converted_bytes, output_filename)

    # Return the converted image
    return Response(
        content=converted_bytes,
        media_type=get_content_type(target_format),
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"'
        }
    )


# =============================================================================
# DATA CONVERSION
# =============================================================================

@router.post("/data")
async def convert_data_endpoint(
    request: Request,
    file: UploadFile = File(..., description="Data file to convert"),
    source_format: Optional[str] = Form(
        default=None,
        description="Source format (auto-detected if not provided)"
    ),
    target_format: str = Form(
        ...,
        description="Target format: json, csv, xlsx, or xml"
    ),
):
    """
    Convert between data formats using hub-and-spoke architecture.

    **Supported Formats**: JSON, CSV, XLSX, XML

    **Architecture**: Input → DataFrame (Hub) → Output
    """
    # --- Auth (optional) ---
    user_id = await get_optional_user(request)

    # Validate target format
    target_format = target_format.lower()
    if not validate_data_format(target_format):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target format '{target_format}'. Allowed: {', '.join(SUPPORTED_DATA_FORMATS)}"
        )

    # Validate source format if provided
    if source_format:
        source_format = source_format.lower()
        if not validate_data_format(source_format):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source format '{source_format}'. Allowed: {', '.join(SUPPORTED_DATA_FORMATS)}"
            )

    # Auto-detect source format from filename if not provided
    if not source_format:
        source_format = get_data_format_from_filename(file.filename or "")
        if not source_format:
            raise HTTPException(
                status_code=400,
                detail="Could not detect source format. Please provide source_format parameter."
            )

    # Read file contents
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # Validate file size
    if not validate_file_size(len(file_bytes), settings.MAX_FILE_SIZE):
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {max_mb:.0f}MB."
        )

    # Check if source and target are the same
    if source_format == target_format:
        raise HTTPException(
            status_code=400,
            detail=f"Source and target formats are the same ({source_format}). No conversion needed."
        )

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

    # Perform conversion
    try:
        converted_bytes, row_count, col_count = convert_data(
            file_bytes=file_bytes,
            source_format=source_format,
            target_format=target_format,
        )
    except ValueError as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if conversion_id:
            fail_conversion(conversion_id, str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {str(e)}"
        )

    # Generate output filename
    output_filename = get_data_output_filename(file.filename or "converted", target_format)
    output_filename = sanitize_filename(output_filename)

    # --- Supabase: upload converted + complete record ---
    if user_id and conversion_id:
        converted_path = upload_file(BUCKET_CONVERTED, converted_bytes, user_id, output_filename)
        if converted_path:
            complete_conversion(conversion_id, converted_path, len(converted_bytes))
            increment_user_stats(user_id, len(converted_bytes))
    else:
        save_to_history(converted_bytes, output_filename)

    # Return the converted data
    return Response(
        content=converted_bytes,
        media_type=get_data_content_type(target_format),
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "X-Row-Count": str(row_count),
            "X-Column-Count": str(col_count),
        }
    )


@router.get("/formats")
async def get_supported_formats():
    """Get list of supported image formats."""
    return {
        "supported_formats": list(SUPPORTED_FORMATS),
        "notes": {
            "jpg_jpeg": "JPG and JPEG are equivalent (both output as .jpg)",
            "transparency": "PNG supports transparency, JPG/JPEG do not",
            "animation": "GIF animation is not preserved when converting to other formats",
            "colors": "GIF is limited to 256 colors"
        }
    }


@router.get("/data/formats")
async def get_data_formats():
    """Get list of supported data formats and conversion info."""
    return {
        "supported_formats": list(SUPPORTED_DATA_FORMATS),
        "architecture": "hub-and-spoke (Input → DataFrame → Output)",
        "notes": {
            "json": "Supports array of objects or single object, nested objects are flattened",
            "csv": "Comma-separated values, first row is headers",
            "xlsx": "Excel format, only first sheet is read/written",
            "xml": "Expected structure: <root><row><col>value</col></row></root>"
        }
    }
