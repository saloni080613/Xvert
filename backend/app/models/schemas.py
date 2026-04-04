"""
Pydantic Schemas for Image Conversion
=====================================

These models define the request/response structure for the API.

Pydantic provides:
1. Data validation - ensures required fields are present
2. Type coercion - converts strings to proper types
3. Documentation - auto-generates OpenAPI schema
"""

from pydantic import BaseModel, Field
from typing import Optional


class ImageConversionRequest(BaseModel):
    """
    Request model for image conversion.
    
    The actual file comes via multipart form data,
    but these fields come as form parameters alongside the file.
    """
    source_format: Optional[str] = Field(
        default=None,
        description="Source format (png, jpg, jpeg, gif). Auto-detected if not provided."
    )
    target_format: str = Field(
        ...,  # Required field
        description="Target format to convert to (png, jpg, jpeg, gif)"
    )
    # --- NEW ADVANCED TWEAK PARAMETERS ---
    width: Optional[int] = Field(
        default=None,
        description="Target width in pixels. If only width is provided, height auto-scales."
    )
    height: Optional[int] = Field(
        default=None,
        description="Target height in pixels. If only height is provided, width auto-scales."
    )
    quality: int = Field(
        default=95,
        ge=1,
        le=100,
        description="Compression quality for JPEGs and WebP (1-100)"
    )


class ImageConversionResponse(BaseModel):
    """Response model for image conversion metadata."""
    success: bool
    original_format: str
    converted_format: str
    original_filename: str
    converted_filename: str
    message: str


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str

class DocumentConversionRequest(BaseModel):
    source_format: str = Field(..., description="Source format (docx, pdf, csv, json, etc)")
    target_format: str = Field(..., description="Target format (pdf, docx, xlsx, csv, etc)")
    preserve_layout: bool = Field(default=True, description="Attempt to preserve original layout")

class DocumentConversionResponse(BaseModel):
    success: bool
    original_format: str
    converted_format: str
    original_filename: str
    converted_filename: str
    message: str

class ErrorResponse(BaseModel):
    detail: str