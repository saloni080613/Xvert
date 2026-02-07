"""
Convert Router - Image Conversion API Endpoints
================================================

This router handles all image conversion requests.

API Flow:
1. Client sends POST request with file + target_format
2. Server validates the file type and size
3. Server converts the image using the image_converter service
4. Server returns the converted image as a downloadable response
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from typing import Optional

from app.services.image_converter import (
    convert_image,
    get_mime_type,
    validate_format,
    SUPPORTED_FORMATS,
)
from app.services.data_converter import (
    convert_data,
    validate_data_format,
    get_data_content_type,
    SUPPORTED_DATA_FORMATS,
)
from app.utils.file_utils import (
    get_format_from_filename,
    get_output_filename,
    get_content_type,
    validate_file_size,
    sanitize_filename,
    get_data_format_from_filename,
    get_data_output_filename,
)
from app.config import settings


router = APIRouter()


@router.post("/image")
async def convert_image_endpoint(
    file: UploadFile = File(..., description="Image file to convert"),
    source_format: Optional[str] = Form(
        default=None,
        description="Source format (auto-detected if not provided)"
    ),
    target_format: str = Form(
        ...,
        description="Target format: png, jpg, jpeg, or gif"
    ),
):
    """
    Convert an image to a different format.
    
    **Supported Formats**: PNG, JPG, JPEG, GIF
    
    **How it works**:
    1. Upload your image file
    2. Optionally specify the source format (auto-detected from file if omitted)
    3. Specify the target format you want
    4. Receive the converted image as a download
    
    **Example**:
    - Upload `photo.png` with target_format=`jpg` → Downloads `photo.jpg`
    - Upload `image.gif` with target_format=`png` → Downloads `image.png`
    
    **Notes**:
    - PNG → JPG: Transparency is flattened to white background
    - GIF → Other: Only first frame is converted (animations not preserved)
    - Any → GIF: Colors are reduced to 256 (GIF limitation)
    """
    # Validate target format
    target_format = target_format.lower()
    if not validate_format(target_format):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target format '{target_format}'. Allowed: {', '.join(SUPPORTED_FORMATS)}"
        )
    
    # Validate source format if provided
    if source_format:
        source_format = source_format.lower()
        if not validate_format(source_format):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source format '{source_format}'. Allowed: {', '.join(SUPPORTED_FORMATS)}"
            )
    
    # Auto-detect source format from filename if not provided
    if not source_format:
        source_format = get_format_from_filename(file.filename or "")
        if not source_format:
            raise HTTPException(
                status_code=400,
                detail="Could not detect source format. Please provide source_format parameter."
            )
    
    # Read file contents
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Validate file size
    if not validate_file_size(len(file_bytes), settings.MAX_FILE_SIZE):
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {max_mb:.0f}MB."
        )
    
    # Check if source and target are the same (no conversion needed)
    if source_format == target_format or (source_format == "jpeg" and target_format == "jpg") or (source_format == "jpg" and target_format == "jpeg"):
        raise HTTPException(
            status_code=400,
            detail=f"Source and target formats are the same ({source_format}). No conversion needed."
        )
    
    # Perform conversion
    try:
        converted_bytes, detected_format = convert_image(
            file_bytes=file_bytes,
            source_format=source_format,
            target_format=target_format,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {str(e)}"
        )
    
    # Generate output filename (sanitize to remove unicode chars for HTTP headers)
    output_filename = get_output_filename(file.filename or "converted", target_format)
    output_filename = sanitize_filename(output_filename)
    
    # Return the converted image
    return Response(
        content=converted_bytes,
        media_type=get_content_type(target_format),
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"'
        }
    )


@router.get("/formats")
async def get_supported_formats():
    """
    Get list of supported image formats.
    
    Returns the formats that can be used as source or target for conversion.
    """
    return {
        "supported_formats": list(SUPPORTED_FORMATS),
        "notes": {
            "jpg_jpeg": "JPG and JPEG are equivalent (both output as .jpg)",
            "transparency": "PNG supports transparency, JPG/JPEG do not",
            "animation": "GIF animation is not preserved when converting to other formats",
            "colors": "GIF is limited to 256 colors"
        }
    }


# =============================================================================
# DATA CONVERSION ENDPOINTS
# =============================================================================

@router.post("/data")
async def convert_data_endpoint(
    file: UploadFile = File(..., description="Data file to convert"),
    source_format: Optional[str] = Form(
        default=None,
        description="Source format (auto-detected if not provided)"
    ),
    target_format: str = Form(
        ...,
        description="Target format: json, csv, xlsx, or xml"
    ),
):
    """
    Convert between data formats using hub-and-spoke architecture.
    
    **Supported Formats**: JSON, CSV, XLSX, XML
    
    **How it works**:
    1. Upload your data file
    2. Optionally specify the source format (auto-detected from file if omitted)
    3. Specify the target format you want
    4. Receive the converted file as a download
    
    **Architecture**: Input → DataFrame (Hub) → Output
    
    **Example**:
    - Upload `data.json` with target_format=`csv` → Downloads `data.csv`
    - Upload `report.xlsx` with target_format=`json` → Downloads `report.json`
    
    **Notes**:
    - JSON: Supports array of objects or single object
    - CSV: First row treated as headers
    - XLSX: Only first sheet is converted
    - XML: Expected format is <root><row>...</row></root>
    """
    # Validate target format
    target_format = target_format.lower()
    if not validate_data_format(target_format):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target format '{target_format}'. Allowed: {', '.join(SUPPORTED_DATA_FORMATS)}"
        )
    
    # Validate source format if provided
    if source_format:
        source_format = source_format.lower()
        if not validate_data_format(source_format):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source format '{source_format}'. Allowed: {', '.join(SUPPORTED_DATA_FORMATS)}"
            )
    
    # Auto-detect source format from filename if not provided
    if not source_format:
        source_format = get_data_format_from_filename(file.filename or "")
        if not source_format:
            raise HTTPException(
                status_code=400,
                detail="Could not detect source format. Please provide source_format parameter."
            )
    
    # Read file contents
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Validate file size
    if not validate_file_size(len(file_bytes), settings.MAX_FILE_SIZE):
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {max_mb:.0f}MB."
        )
    
    # Check if source and target are the same (no conversion needed)
    if source_format == target_format:
        raise HTTPException(
            status_code=400,
            detail=f"Source and target formats are the same ({source_format}). No conversion needed."
        )
    
    # Perform conversion using hub-and-spoke model
    try:
        converted_bytes, row_count, col_count = convert_data(
            file_bytes=file_bytes,
            source_format=source_format,
            target_format=target_format,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {str(e)}"
        )
    
    # Generate output filename
    output_filename = get_data_output_filename(file.filename or "converted", target_format)
    output_filename = sanitize_filename(output_filename)
    
    # Return the converted data
    return Response(
        content=converted_bytes,
        media_type=get_data_content_type(target_format),
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "X-Row-Count": str(row_count),
            "X-Column-Count": str(col_count),
        }
    )


@router.get("/data/formats")
async def get_data_formats():
    """
    Get list of supported data formats and conversion info.
    
    Returns the formats that can be used as source or target for data conversion.
    """
    return {
        "supported_formats": list(SUPPORTED_DATA_FORMATS),
        "architecture": "hub-and-spoke (Input → DataFrame → Output)",
        "notes": {
            "json": "Supports array of objects or single object, nested objects are flattened",
            "csv": "Comma-separated values, first row is headers",
            "xlsx": "Excel format, only first sheet is read/written",
            "xml": "Expected structure: <root><row><col>value</col></row></root>"
        }
    }

