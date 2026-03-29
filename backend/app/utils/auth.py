"""
Auth Utility
============
Optional auth dependency for FastAPI endpoints.
Extracts user_id from the Authorization header JWT.
Returns None if no valid token is present — endpoints remain usable without auth.
"""

from fastapi import Request
from typing import Optional
from app.services.supabase_service import get_supabase
from fastapi import HTTPException, status


async def get_optional_user(request: Request) -> Optional[str]:
    """
    Extract user ID from the Authorization: Bearer <token> header.

    Returns:
        user_id (str) if a valid Supabase JWT is present, else None.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    if not token or token == "null" or token == "undefined":
        return None

    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return str(user_response.user.id)
        return None
    except Exception as e:
        print(f"[Auth] Token validation failed: {e}")
        return None
async def get_current_user(request: Request) -> str:
    """
    Strict version of get_optional_user.
    Raises 401 if no valid session instead of returning None.
    Used by routes that require authentication.
    """
    user_id = await get_optional_user(request)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id