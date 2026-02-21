"""
Supabase Storage Service
========================
Handles file uploads, signed URL generation, and deletion
from Supabase Storage Buckets ("originals" and "converted").
"""

import uuid
from typing import Optional
from app.services.supabase_service import get_supabase


BUCKET_ORIGINALS = "originals"
BUCKET_CONVERTED = "converted"


def _build_path(user_id: str, filename: str) -> str:
    """Build a unique storage path: {user_id}/{uuid}_{filename}"""
    unique_prefix = uuid.uuid4().hex[:8]
    return f"{user_id}/{unique_prefix}_{filename}"


def upload_file(bucket: str, file_bytes: bytes, user_id: str, filename: str) -> Optional[str]:
    """
    Upload file bytes to a Supabase Storage bucket.

    Args:
        bucket: Bucket name ("originals" or "converted")
        file_bytes: Raw file content
        user_id: The authenticated user's UUID
        filename: Original or output filename

    Returns:
        The storage path on success, None on failure
    """
    try:
        supabase = get_supabase()
        path = _build_path(user_id, filename)
        print(f"[StorageService] Uploading to {bucket}/{path} ({len(file_bytes)} bytes)...")
        result = supabase.storage.from_(bucket).upload(
            path,
            file_bytes,
            {"content-type": "application/octet-stream"}
        )
        print(f"[StorageService] Upload success: {result}")
        return path
    except Exception as e:
        print(f"[StorageService] Upload FAILED ({bucket}/{filename}): {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_signed_url(bucket: str, path: str, expires_in: int = 1800) -> Optional[str]:
    """
    Generate a signed download URL for a file in a bucket.

    Args:
        bucket: Bucket name
        path: Storage path (as returned by upload_file)
        expires_in: Seconds until the URL expires (default 30 min)

    Returns:
        Signed URL string, or None on failure
    """
    try:
        supabase = get_supabase()
        result = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
        return result.get("signedURL") or result.get("signedUrl")
    except Exception as e:
        print(f"[StorageService] Signed URL failed ({bucket}/{path}): {e}")
        return None


def delete_file(bucket: str, path: str) -> bool:
    """
    Delete a file from a Supabase Storage bucket.

    Args:
        bucket: Bucket name
        path: Storage path

    Returns:
        True on success, False on failure
    """
    try:
        supabase = get_supabase()
        supabase.storage.from_(bucket).remove([path])
        return True
    except Exception as e:
        print(f"[StorageService] Delete failed ({bucket}/{path}): {e}")
        return False
