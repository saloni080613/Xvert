from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List
# Note: We removed data_converter to avoid conflict with Saloni's work
from app.services.document_converter import convert_document, merge_pdfs

router = APIRouter()

@router.post("/convert/document")
async def convert_document_endpoint(
    file: UploadFile = File(...),
    source_format: str = Form(...),
    target_format: str = Form(...)
):
    try:
        file_path = await convert_document(file, source_format, target_format)
        return FileResponse(file_path, filename=file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert/merge")
async def merge_documents_endpoint(
    files: List[UploadFile] = File(...)
):
    try:
        file_path = await merge_pdfs(files)
        return FileResponse(file_path, filename="merged_output.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))