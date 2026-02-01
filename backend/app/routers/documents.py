from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from app.services.document_converter import convert_document
from app.services.data_converter import convert_data

router = APIRouter()

@router.post("/convert/document")
async def convert_document_endpoint(
    file: UploadFile = File(...),
    source_format: str = Form(...),
    target_format: str = Form(...)
):
    try:
        data_formats = ["csv", "json", "xlsx"]
        
        if source_format in data_formats:
            file_path = await convert_data(file, source_format, target_format)
        else:
            file_path = await convert_document(file, source_format, target_format)
            
        return FileResponse(file_path, filename=file_path)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))