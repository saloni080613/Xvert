"""
File Utilities for Conversion Service
======================================

Helper functions for file handling, validation, and naming.
"""

import os
from typing import Optional


# Map of extensions to their normalized format names
EXTENSION_MAP = {
    ".png": "png",
    ".jpg": "jpg",
    ".jpeg": "jpeg",
    ".gif": "gif",
}

# Map format to file extension (for output files)
FORMAT_TO_EXTENSION = {
    "png": ".png",
    "jpg": ".jpg",
    "jpeg": ".jpeg",  # Preserve user's choice of extension
    "gif": ".gif",
}


def get_format_from_filename(filename: str) -> Optional[str]:
    """
    Extract and validate format from filename extension.
    
    Args:
        filename: Original filename with extension
    
    Returns:
        Normalized format string (png, jpg, jpeg, gif) or None if invalid
    
    Example:
        get_format_from_filename("image.PNG") -> "png"
        get_format_from_filename("photo.JPEG") -> "jpeg"
    """
    if not filename:
        return None
    
    ext = os.path.splitext(filename)[1].lower()
    return EXTENSION_MAP.get(ext)


def get_output_filename(original_filename: str, target_format: str) -> str:
    """
    Generate output filename with the new extension.
    
    Args:
        original_filename: Original file name
        target_format: Target format (png, jpg, jpeg, gif)
    
    Returns:
        New filename with appropriate extension
    
    Example:
        get_output_filename("photo.png", "jpg") -> "photo.jpg"
        get_output_filename("image.gif", "png") -> "image.png"
    """
    base_name = os.path.splitext(original_filename)[0]
    new_extension = FORMAT_TO_EXTENSION.get(target_format.lower(), f".{target_format}")
    return f"{base_name}{new_extension}"


def validate_file_size(file_size: int, max_size: int) -> bool:
    """
    Check if file size is within allowed limits.
    
    Args:
        file_size: Size of the file in bytes
        max_size: Maximum allowed size in bytes
    
    Returns:
        True if valid, False if too large
    """
    return file_size <= max_size


def get_content_type(format: str) -> str:
    """
    Get the HTTP Content-Type header value for a format.
    
    Args:
        format: Image format (png, jpg, jpeg, gif)
    
    Returns:
        MIME type string
    """
    mime_types = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
    }
    return mime_types.get(format.lower(), "application/octet-stream")


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to remove characters that can't be encoded in HTTP headers.
    
    HTTP headers use latin-1 encoding, so we must remove or replace
    characters outside the ASCII range (like emojis, special unicode).
    
    Args:
        filename: Original filename (may contain unicode)
    
    Returns:
        Sanitized filename safe for Content-Disposition header
    
    Example:
        sanitize_filename("TEARS 🌸.jpg") -> "TEARS_.jpg"
    """
    # Try to encode as ASCII, replacing non-encodable chars
    sanitized = ""
    for char in filename:
        try:
            char.encode('latin-1')
            sanitized += char
        except UnicodeEncodeError:
            sanitized += "_"  # Replace with underscore
    
    # If filename became empty or just extension, use default
    if not sanitized or sanitized.startswith('.'):
        sanitized = "converted" + sanitized
    
    return sanitized
