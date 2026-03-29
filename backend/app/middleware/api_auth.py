"""
API Auth Middleware
===================
Middleware to intercept requests to /v1/ paths.
Validates X-API-Key, handles rate limiting, and logs usage to api_usage.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import hashlib
import time
from datetime import datetime
from app.services.supabase_service import get_supabase
import asyncio

class ApiKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/v1/"):
            return await call_next(request)
            
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return JSONResponse(
                status_code=401,
                content={"error": "Missing X-API-Key header", "code": "INVALID_KEY"}
            )
            
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        supabase = get_supabase()
        
        # Verify Key
        try:
            result = supabase.table("api_keys").select("*").eq("key_hash", key_hash).eq("is_active", True).execute()
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": f"Database error: {str(e)}", "code": "DB_ERROR"})
            
        if not result.data:
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid or revoked API key", "code": "INVALID_KEY"}
            )
            
        key_record = result.data[0]
        api_key_id = key_record["id"]
        user_id = key_record["user_id"]
        
        # Rate Limiting (200 calls per calendar month)
        now = datetime.utcnow()
        first_of_month = datetime(now.year, now.month, 1).isoformat()
        
        try:
            count_res = supabase.table("api_usage").select("id", count="exact").eq("api_key_id", api_key_id).gte("called_at", first_of_month).execute()
            current_usage = count_res.count if hasattr(count_res, 'count') else (len(count_res.data) if count_res.data else 0)
        except Exception:
            current_usage = 0
            
        if current_usage >= 200:
            return JSONResponse(
                status_code=429,
                content={"error": "Monthly limit of 200 calls reached", "code": "RATE_LIMIT_EXCEEDED"},
                headers={"X-RateLimit-Limit": "200", "X-RateLimit-Remaining": "0"}
            )
            
        request.state.api_key_id = api_key_id
        request.state.api_user_id = user_id
        
        tool_id = request.url.path.split("/")[-1]
        content_length = request.headers.get("Content-Length")
        file_size_kb = int(int(content_length) / 1024) if content_length and content_length.isdigit() else 0
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
        except Exception as exc:
            raise exc

        # Execute immediately after the endpoint completes
        duration_ms = int((time.time() - start_time) * 1000)
        status = "success" if response.status_code < 400 else "error"
        
        # Force a proper ISO timestamp with Z so Postgres parses it 100% correctly
        now_iso = datetime.utcnow().isoformat() + "Z"
        
        def log_supabase():
            try:
                supa = get_supabase()
                supa.table("api_keys").update({"last_used_at": now_iso}).eq("id", api_key_id).execute()
                supa.table("api_usage").insert({
                    "api_key_id": api_key_id,
                    "user_id": user_id,
                    "tool_id": tool_id,
                    "file_size_kb": file_size_kb,
                    "duration_ms": duration_ms,
                    "status": status,
                    "called_at": now_iso
                }).execute()
            except Exception:
                pass
                
        # Run blocking Supabase call sequentially right here to ensure the data is written BEFORE response ends
        # asyncio.to_thread runs it safely without blocking the core event loop
        await asyncio.to_thread(log_supabase)
            
        response.headers["X-RateLimit-Limit"] = "200"
        response.headers["X-RateLimit-Remaining"] = str(max(0, 200 - current_usage - 1))
            
        return response
