from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
from app.utils.file_utils import save_to_history, sanitize_filename, fetch_cloud_file
from fastapi.responses import FileResponse
from typing import List, Optional
# Note: We removed data_converter to avoid conflict with Saloni's work
from app.services.document_converter import convert_document, merge_pdfs

router = APIRouter()

@router.post("/convert/document")
async def convert_document_endpoint(
    source_format: str = Form(...),
    target_format: str = Form(...),
    file: Optional[UploadFile] = File(None),
    cloud_url: Optional[str] = Form(None),
    filename: Optional[str] = Form(None)
):
    try:
        if not file and not cloud_url:
            raise HTTPException(status_code=400, detail="Must provide either file or cloud_url")
            
        if cloud_url:
            file = fetch_cloud_file(cloud_url, filename or "cloud_document")
            
        file_path = await convert_document(file, source_format, target_format)
        
        # Save to history
        with open(file_path, "rb") as f:
            content = f.read()
            filename = os.path.basename(file_path)
            save_to_history(content, filename)
            
        return FileResponse(file_path, filename=file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert/merge")
async def merge_documents_endpoint(
    files: List[UploadFile] = File([]),
    cloud_urls: List[str] = Form([]),
    filenames: List[str] = Form([])
):
    try:
        all_files = list(files) if files else []
        
        # Download cloud files
        if cloud_urls:
            for i, url in enumerate(cloud_urls):
                fname = filenames[i] if i < len(filenames) else f"cloud_merge_{i}.pdf"
                all_files.append(fetch_cloud_file(url, fname))
                
        if len(all_files) < 2:
            raise HTTPException(status_code=400, detail="Must provide at least 2 files to merge")
            
        file_path = await merge_pdfs(all_files)
        
        # Save to history
        with open(file_path, "rb") as f:
            content = f.read()
            filename = "merged_output.pdf" # This might be temp name, let's stick to it or sanitize
            save_to_history(content, filename)

        return FileResponse(file_path, filename="merged_output.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))