"""
Conversion History Service
==========================
CRUD operations on the Supabase `conversions` table and
profile stat updates on the `profiles` table.
"""

from typing import Optional
from datetime import datetime, timezone
from app.services.supabase_service import get_supabase


def create_conversion_record(
    user_id: str,
    original_filename: str,
    original_format: str,
    converted_format: str,
    original_file_url: Optional[str] = None,
    file_size_original: Optional[int] = None,
) -> Optional[str]:
    """
    Insert a new conversion record with status 'pending'.

    Returns:
        The conversion UUID on success, None on failure.
    """
    try:
        supabase = get_supabase()
        result = supabase.table("conversions").insert({
            "user_id": user_id,
            "original_filename": original_filename,
            "original_format": original_format,
            "converted_format": converted_format,
            "original_file_url": original_file_url,
            "file_size_original": file_size_original,
            "status": "pending",
        }).execute()

        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        return None
    except Exception as e:
        print(f"[HistoryService] Create record failed: {e}")
        return None


def complete_conversion(
    conversion_id: str,
    converted_file_url: str,
    file_size_converted: int,
) -> bool:
    """
    Mark a conversion as completed.

    Args:
        conversion_id: UUID of the conversion record
        converted_file_url: Storage path of the converted file
        file_size_converted: Size of converted file in bytes
    """
    try:
        supabase = get_supabase()
        supabase.table("conversions").update({
            "status": "completed",
            "converted_file_url": converted_file_url,
            "file_size_converted": file_size_converted,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", conversion_id).execute()
        return True
    except Exception as e:
        print(f"[HistoryService] Complete conversion failed: {e}")
        return False


def fail_conversion(conversion_id: str, error_message: str) -> bool:
    """Mark a conversion as failed with an error message."""
    try:
        supabase = get_supabase()
        supabase.table("conversions").update({
            "status": "failed",
            "error_message": error_message,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", conversion_id).execute()
        return True
    except Exception as e:
        print(f"[HistoryService] Fail conversion failed: {e}")
        return False


def increment_user_stats(user_id: str, file_size: int) -> bool:
    """
    Increment total_conversions by 1 and add file_size to storage_used
    in the profiles table.
    """
    try:
        supabase = get_supabase()

        # Fetch current values
        result = supabase.table("profiles").select(
            "total_conversions, storage_used"
        ).eq("id", user_id).execute()

        if result.data and len(result.data) > 0:
            current = result.data[0]
            supabase.table("profiles").update({
                "total_conversions": (current.get("total_conversions") or 0) + 1,
                "storage_used": (current.get("storage_used") or 0) + file_size,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", user_id).execute()
            return True
        return False
    except Exception as e:
        print(f"[HistoryService] Increment stats failed: {e}")
        return False


def get_user_conversions(user_id: str, limit: int = 50):
    """
    Fetch a user's conversion history, newest first.

    Returns:
        List of conversion records, or empty list on failure.
    """
    try:
        supabase = get_supabase()
        result = supabase.table("conversions").select("*").eq(
            "user_id", user_id
        ).order(
            "created_at", desc=True
        ).limit(limit).execute()
        return result.data or []
    except Exception as e:
        print(f"[HistoryService] Get conversions failed: {e}")
        return []


def delete_conversion(conversion_id: str, user_id: str) -> bool:
    """
    Delete a conversion record (RLS also enforces ownership on frontend,
    but we double-check user_id here for backend calls).
    """
    try:
        supabase = get_supabase()
        supabase.table("conversions").delete().eq(
            "id", conversion_id
        ).eq(
            "user_id", user_id
        ).execute()
        return True
    except Exception as e:
        print(f"[HistoryService] Delete conversion failed: {e}")
        return False
