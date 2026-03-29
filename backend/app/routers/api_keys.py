"""
API Keys Router
================
Manage user API keys and usage statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
import secrets
import hashlib
from datetime import datetime, timedelta

from app.utils.auth import get_current_user
from app.services.supabase_service import get_supabase

router = APIRouter()

@router.post("/keys/generate")
async def generate_api_key(user_id: str = Depends(get_current_user), payload: dict = Body(default={})):
    """Generate a new secure API key for the user."""
    raw_key = "xvt_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12]
    key_name = payload.get("name", "New Key")

    supabase = get_supabase()
    result = supabase.table("api_keys").insert({
        "user_id": user_id,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "name": key_name,
        "is_active": True
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create API key")

    new_row = result.data[0]
    
    return {
        "key": raw_key,
        "id": new_row["id"],
        "prefix": new_row["key_prefix"]
    }

@router.get("/keys/list")
async def list_api_keys(user_id: str = Depends(get_current_user)):
    """List all API keys for the current user."""
    supabase = get_supabase()
    result = supabase.table("api_keys").select(
        "id, key_prefix, name, is_active, created_at, last_used_at"
    ).eq("user_id", user_id).eq("is_active", True).order("created_at", desc=True).execute()
    
    return {"keys": result.data or []}

@router.patch("/keys/{key_id}/rename")
async def rename_api_key(key_id: str, payload: dict = Body(...), user_id: str = Depends(get_current_user)):
    """Rename an API key."""
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
        
    supabase = get_supabase()
    result = supabase.table("api_keys").update({"name": name}).eq("id", key_id).eq("user_id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Key not found")
        
    return {"success": True, "key": result.data[0]}

@router.delete("/keys/{key_id}/revoke")
async def revoke_api_key(key_id: str, user_id: str = Depends(get_current_user)):
    """Revoke an API key by setting is_active=false."""
    supabase = get_supabase()
    result = supabase.table("api_keys").update({"is_active": False}).eq("id", key_id).eq("user_id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Key not found")
        
    return {"success": True}

@router.get("/keys/usage")
async def get_api_usage(user_id: str = Depends(get_current_user)):
    """Get usage statistics for the user's API keys for the last 30 days."""
    supabase = get_supabase()
    
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    
    result = supabase.table("api_usage").select("*").eq("user_id", user_id).gte("called_at", thirty_days_ago).order("called_at", desc=True).execute()
    
    rows = result.data or []
    
    total_calls = len(rows)
    by_tool = {}
    by_date_map = {}
    
    for row in rows:
        tool = row.get("tool_id") or "unknown"
        by_tool[tool] = by_tool.get(tool, 0) + 1
        
        date_str = row.get("called_at", "")[:10]  # YY-MM-DD
        if date_str:
            by_date_map[date_str] = by_date_map.get(date_str, 0) + 1
            
    # Format by_date for charts
    by_date = []
    # Fill in previous 30 days
    for i in range(29, -1, -1):
        dt = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        # Format date as short (e.g., "Mar 1")
        dt_obj = datetime.strptime(dt, "%Y-%m-%d")
        short_date = dt_obj.strftime("%b %d").replace(" 0", " ")
        by_date.append({
            "date": short_date,
            "count": by_date_map.get(dt, 0)
        })

    recent_rows = rows[:20]
    
    return {
        "total_calls": total_calls,
        "by_tool": by_tool,
        "by_date": by_date,
        "recent": recent_rows
    }
