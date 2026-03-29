"""
Public API endpoints
====================
Thin wrappers around existing conversion services, strictly exposed at /v1.
Returns JSON with a download URL instead of raw binary.
"""
from fastapi import APIRouter, File, UploadFile, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, Response
import io
import os
import tempfile
import shutil
import uuid
import time
from collections import OrderedDict
from typing import Optional, List

from app.services.document_converter import convert_document, merge_pdfs
from app.services.image_converter import convert_image
from app.services.data_converter import convert_data
from app.services.ocr_service import ocr_pdf_to_docx, ocr_image_to_docx

if "app.services.ocr_service" not in locals():
    # Defensive import
    pass

router = APIRouter(prefix="/v1")

# { token: { "path": str, "filename": str, "created_at": float } }
_download_store: dict = OrderedDict()
_STORE_TTL_SECONDS = 300   # files expire after 5 minutes

def _store_file(file_path: str, filename: str) -> str:
    token = uuid.uuid4().hex
    _download_store[token] = {
        "path": file_path,
        "filename": filename,
        "created_at": time.time()
    }
    # Evict expired entries (keep store small)
    _evict_expired()
    return token

def _evict_expired():
    now = time.time()
    expired = [k for k, v in _download_store.items()
               if now - v["created_at"] > _STORE_TTL_SECONDS]
    for k in expired:
        entry = _download_store.pop(k, None)
        if entry:
            try:
                os.remove(entry["path"])
            except Exception:
                pass

def write_temp(upload_file: UploadFile) -> str:
    ext = os.path.splitext(upload_file.filename or "")[1]
    fd, path = tempfile.mkstemp(suffix=ext)
    with os.fdopen(fd, 'wb') as f:
        shutil.copyfileobj(upload_file.file, f)
    return path

def _cleanup_downloaded_file(path: str):
    """Background task to remove file from disk after sending."""
    try:
        os.remove(path)
    except Exception:
        pass

@router.get("/download/{token}")
async def download_file(token: str, background_tasks: BackgroundTasks):
    _evict_expired()
    entry = _download_store.pop(token, None)
    if not entry or not os.path.exists(entry["path"]):
        return JSONResponse(status_code=404, content={"error": "File not found or expired", "code": "FILE_EXPIRED"})
    
    background_tasks.add_task(_cleanup_downloaded_file, entry["path"])
    return FileResponse(entry["path"], filename=entry["filename"])

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tif", ".tiff"}

# -------------------------------------------------------------
# POST /v1/convert/document
# -------------------------------------------------------------
@router.post("/convert/document")
async def convert_document_v1(file: UploadFile = File(...), target_format: str = Form(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".pdf", ".docx", ".doc"]:
        return JSONResponse(status_code=400, content={"error": f"Unsupported input format: {ext}", "code": "UNSUPPORTED_FORMAT"})
    
    target_format = target_format.lower()
    if target_format not in ["docx", "pdf", "jpg", "png", "jpeg"]:
        return JSONResponse(status_code=400, content={"error": f"Invalid target format: {target_format}", "code": "UNSUPPORTED_FORMAT"})
    
    try:
        source_format = ext.strip(".")
        output_path = await convert_document(file, source_format, target_format)
        
        target_filename = f"converted.{target_format}"
        token = _store_file(output_path, target_filename)
        return {
            "success": True,
            "download_url": f"/v1/download/{token}",
            "filename": target_filename,
            "expires_in_seconds": _STORE_TTL_SECONDS
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "code": "CONVERSION_FAILED"})

# -------------------------------------------------------------
# POST /v1/convert/image
# -------------------------------------------------------------
@router.post("/convert/image")
async def convert_image_v1(file: UploadFile = File(...), target_format: str = Form(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in IMAGE_EXTS:
        return JSONResponse(status_code=400, content={"error": f"Unsupported input format: {ext}", "code": "UNSUPPORTED_FORMAT"})
    
    target_format = target_format.lower()
    if target_format not in ["jpg", "jpeg", "png", "gif", "bmp", "pdf", "webp"]:
        return JSONResponse(status_code=400, content={"error": f"Invalid target format: {target_format}", "code": "UNSUPPORTED_FORMAT"})
    
    try:
        source_format = ext.strip(".")
        file_bytes = await file.read()
        converted_bytes, detected_format = convert_image(file_bytes=file_bytes, source_format=source_format, target_format=target_format)
        
        fd, output_path = tempfile.mkstemp(suffix=f".{target_format}")
        with os.fdopen(fd, 'wb') as f:
            f.write(converted_bytes)

        target_filename = f"converted.{target_format}"
        token = _store_file(output_path, target_filename)
        return {
            "success": True,
            "download_url": f"/v1/download/{token}",
            "filename": target_filename,
            "expires_in_seconds": _STORE_TTL_SECONDS
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "code": "CONVERSION_FAILED"})

# -------------------------------------------------------------
# POST /v1/convert/data
# -------------------------------------------------------------
@router.post("/convert/data")
async def convert_data_v1(file: UploadFile = File(...), target_format: str = Form(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    target_format = target_format.lower()
    supported = ["csv", "json", "xlsx", "xml"]
    
    if ext.strip(".") not in supported and ext not in [".xls"]:
        return JSONResponse(status_code=400, content={"error": f"Unsupported input format: {ext}", "code": "UNSUPPORTED_FORMAT"})
    if target_format not in supported:
        return JSONResponse(status_code=400, content={"error": f"Invalid target format: {target_format}", "code": "UNSUPPORTED_FORMAT"})
    
    try:
        source_format = ext.strip(".")
        if source_format == "xls": source_format = "xlsx"
        file_bytes = await file.read()
        converted_bytes, _, _ = convert_data(file_bytes=file_bytes, source_format=source_format, target_format=target_format)
        
        fd, output_path = tempfile.mkstemp(suffix=f".{target_format}")
        with os.fdopen(fd, 'wb') as f:
            f.write(converted_bytes)

        target_filename = f"converted.{target_format}"
        token = _store_file(output_path, target_filename)
        return {
            "success": True,
            "download_url": f"/v1/download/{token}",
            "filename": target_filename,
            "expires_in_seconds": _STORE_TTL_SECONDS
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "code": "CONVERSION_FAILED"})

# -------------------------------------------------------------
# POST /v1/convert/ocr
# -------------------------------------------------------------
@router.post("/convert/ocr")
async def convert_ocr_v1(file: UploadFile = File(...), format: str = Form("docx")):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".pdf"] and ext not in IMAGE_EXTS:
        return JSONResponse(status_code=400, content={"error": f"Unsupported input: {ext}", "code": "UNSUPPORTED_FORMAT"})
    if format not in ["docx", "txt"]:
        return JSONResponse(status_code=400, content={"error": f"Invalid format: {format}", "code": "UNSUPPORTED_FORMAT"})

    temp_path = ""
    try:
        temp_path = write_temp(file)
        if ext == ".pdf":
            out_path = await ocr_pdf_to_docx(temp_path)
        else:
            out_path = await ocr_image_to_docx(temp_path)
            
        if format == 'txt':
            from docx import Document
            doc = Document(out_path)
            full_text = "\\n".join([p.text for p in doc.paragraphs])
            os.remove(out_path)
            
            fd, txt_path = tempfile.mkstemp(suffix=".txt")
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            target_filename = "converted.txt"
            token = _store_file(txt_path, target_filename)
        else:
            target_filename = "converted.docx"
            token = _store_file(out_path, target_filename)

        return {
            "success": True,
            "download_url": f"/v1/download/{token}",
            "filename": target_filename,
            "expires_in_seconds": _STORE_TTL_SECONDS
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "code": "CONVERSION_FAILED"})
    finally:
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass

# -------------------------------------------------------------
# POST /v1/convert/merge-pdf
# -------------------------------------------------------------
@router.post("/convert/merge-pdf")
async def merge_pdf_v1(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        return JSONResponse(status_code=400, content={"error": "At least 2 files required", "code": "UNSUPPORTED_FORMAT"})
    for file in files:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext != ".pdf":
            return JSONResponse(status_code=400, content={"error": "Only PDF files supported", "code": "UNSUPPORTED_FORMAT"})
    
    try:
        out_path = await merge_pdfs(files)
        
        target_filename = "merged.pdf"
        token = _store_file(out_path, target_filename)
        return {
            "success": True,
            "download_url": f"/v1/download/{token}",
            "filename": target_filename,
            "expires_in_seconds": _STORE_TTL_SECONDS
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "code": "CONVERSION_FAILED"})
