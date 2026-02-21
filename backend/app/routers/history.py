"""
History Router
==============
Dedicated endpoints for conversion history management.
All endpoints require authentication.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional

from app.utils.auth import get_optional_user
from app.services.conversion_history_service import get_user_conversions, delete_conversion
from app.services.storage_service import get_signed_url, delete_file, BUCKET_ORIGINALS, BUCKET_CONVERTED


router = APIRouter()


@router.get("")
async def list_history(request: Request):
    """
    Get the authenticated user's conversion history.
    Returns a list of conversion records, newest first.
    """
    user_id = await get_optional_user(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to view history")

    conversions = get_user_conversions(user_id)
    return {"conversions": conversions}


@router.get("/{conversion_id}/download")
async def download_conversion(conversion_id: str, request: Request):
    """
    Generate a signed download URL for a converted file.
    """
    user_id = await get_optional_user(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Fetch the specific conversion to verify ownership and get file path
    from app.services.supabase_service import get_supabase
    supabase = get_supabase()
    result = supabase.table("conversions").select("*").eq(
        "id", conversion_id
    ).eq(
        "user_id", user_id
    ).execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Conversion not found")

    record = result.data[0]

    if record.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Conversion is not completed")

    converted_path = record.get("converted_file_url")
    if not converted_path:
        raise HTTPException(status_code=404, detail="Converted file not available")

    signed_url = get_signed_url(BUCKET_CONVERTED, converted_path)
    if not signed_url:
        raise HTTPException(status_code=500, detail="Failed to generate download URL")

    return {"download_url": signed_url, "filename": record.get("original_filename", "download")}


@router.delete("/{conversion_id}")
async def delete_history_item(conversion_id: str, request: Request):
    """
    Delete a conversion record and its associated files from storage.
    """
    user_id = await get_optional_user(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Fetch record first to get file paths for cleanup
    from app.services.supabase_service import get_supabase
    supabase = get_supabase()
    result = supabase.table("conversions").select("*").eq(
        "id", conversion_id
    ).eq(
        "user_id", user_id
    ).execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Conversion not found")

    record = result.data[0]

    # Delete files from storage (best effort — don't fail if storage delete fails)
    if record.get("original_file_url"):
        delete_file(BUCKET_ORIGINALS, record["original_file_url"])
    if record.get("converted_file_url"):
        delete_file(BUCKET_CONVERTED, record["converted_file_url"])

    # Delete the database record
    success = delete_conversion(conversion_id, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete conversion record")

    return {"message": "Conversion deleted successfully"}
