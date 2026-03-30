"""
File Utilities for Conversion Service
======================================

Helper functions for file handling, validation, and naming.
"""

import os
from typing import Optional
import io
from fastapi import UploadFile
try:
    import requests as _requests
except ImportError:
    _requests = None


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

# Data format extension mappings
DATA_EXTENSION_MAP = {
    ".json": "json",
    ".csv": "csv",
    ".xlsx": "xlsx",
    ".xml": "xml",
}

DATA_FORMAT_TO_EXTENSION = {
    "json": ".json",
    "csv": ".csv",
    "xlsx": ".xlsx",
    "xml": ".xml",
}

DATA_CONTENT_TYPES = {
    "json": "application/json",
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xml": "application/xml",
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


def get_data_format_from_filename(filename: str) -> Optional[str]:
    """
    Extract and validate data format from filename extension.
    
    Args:
        filename: Original filename with extension
    
    Returns:
        Normalized format string (json, csv, xlsx, xml) or None if invalid
    """
    if not filename:
        return None
    
    ext = os.path.splitext(filename)[1].lower()
    return DATA_EXTENSION_MAP.get(ext)


def get_data_output_filename(original_filename: str, target_format: str) -> str:
    """
    Generate output filename with the new data format extension.
    
    Args:
        original_filename: Original file name
        target_format: Target format (json, csv, xlsx, xml)
    
    Returns:
        New filename with appropriate extension
    """
    base_name = os.path.splitext(original_filename)[0]
    new_extension = DATA_FORMAT_TO_EXTENSION.get(target_format.lower(), f".{target_format}")
    return f"{base_name}{new_extension}"


def get_data_content_type(format: str) -> str:
    """
    Get the HTTP Content-Type header value for a data format.
    
    Args:
        format: Data format (json, csv, xlsx, xml)
    
    Returns:
        MIME type string
    """
    return DATA_CONTENT_TYPES.get(format.lower(), "application/octet-stream")

    return DATA_CONTENT_TYPES.get(format.lower(), "application/octet-stream")


# =============================================================================
# HISTORY MANAGEMENT
# =============================================================================

HISTORY_DIR = "history"
if not os.path.exists(HISTORY_DIR):
    os.makedirs(HISTORY_DIR)

def save_to_history(file_bytes: bytes, filename: str) -> Optional[str]:
    """
    Save a copy of the converted file to history directory.
    
    Args:
        file_bytes: Content of the file
        filename: Name of the file
        
    Returns:
        Path to saved file or None if failed
    """
    try:
        if not os.path.exists(HISTORY_DIR):
            os.makedirs(HISTORY_DIR)
            
        file_path = os.path.join(HISTORY_DIR, filename)
        # Verify unique filename to prevent overwrite
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(file_path):
            file_path = os.path.join(HISTORY_DIR, f"{base}_{counter}{ext}")
            counter += 1
            
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return os.path.basename(file_path)
    except Exception as e:
        print(f"Failed to save history: {e}")
        return None

def _extract_gdrive_file_id(url: str) -> str:
    """Extract Google Drive file ID from a sharing URL."""
    if '/file/d/' in url:
        return url.split('/file/d/')[1].split('/')[0].split('?')[0]
    if 'open?id=' in url:
        return url.split('open?id=')[-1].split('&')[0]
    if 'id=' in url:
        return url.split('id=')[-1].split('&')[0]
    return ''


def normalize_cloud_url(url: str) -> str:
    """Convert cloud share URL variants into direct-download URLs."""
    if not url:
        return url

    url = url.strip()

    # Google Drive link variants
    if 'drive.google.com' in url:
        file_id = _extract_gdrive_file_id(url)
        if file_id:
            return f'https://drive.google.com/uc?export=download&id={file_id}'

    # Dropbox link variants
    if 'dropbox.com' in url:
        # Prefer raw=1 for direct access to file content stream
        if '?raw=1' in url or '&raw=1' in url:
            return url
        if '?' in url:
            # Replace existing dl=0/1 or append raw=1
            new_url = url.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1')
            if 'raw=1' not in new_url:
                new_url += '&raw=1'
            return new_url
        return f"{url}?raw=1"

    return url


def _fetch_with_requests(clean_url: str, is_gdrive: bool) -> bytes:
    """Use the requests library to download, handling GDrive confirmation pages."""
    session = _requests.Session()
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = session.get(clean_url, headers=headers, timeout=60, stream=True)
    response.raise_for_status()

    content_type = response.headers.get('Content-Type', '')

    # Google Drive may return an HTML confirmation page for large files
    if is_gdrive and 'text/html' in content_type:
        # Try to extract the confirm token from cookies or response body
        confirm_token = None
        for key, value in response.cookies.items():
            if key.startswith('download_warning'):
                confirm_token = value
                break

        if not confirm_token:
            # Parse the confirm token from the HTML body
            text = response.text
            import re
            match = re.search(r'confirm=([0-9A-Za-z_\-]+)', text)
            if match:
                confirm_token = match.group(1)

        if confirm_token:
            confirm_url = f"{clean_url}&confirm={confirm_token}"
            response = session.get(confirm_url, headers=headers, timeout=60, stream=True)
            response.raise_for_status()
        else:
            # Newer GDrive anti-scraping: try the export download with UUID
            # Attempt without confirm (sometimes works for smaller files)
            pass

    return response.content


def _fetch_with_urllib(clean_url: str) -> bytes:
    """Fallback download using urllib."""
    import urllib.request
    req = urllib.request.Request(clean_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read()


def fetch_cloud_file(url: str, filename: str) -> UploadFile:
    """Download a file from a URL and return a FastAPI UploadFile object."""
    try:
        clean_url = normalize_cloud_url(url)
        is_gdrive = 'drive.google.com' in url

        if _requests is not None:
            file_bytes = _fetch_with_requests(clean_url, is_gdrive)
        else:
            file_bytes = _fetch_with_urllib(clean_url)

        # If Google Drive returned an HTML page despite our best efforts, fail clearly
        if is_gdrive and file_bytes.lstrip().startswith(b'<!DOCTYPE') or file_bytes.lstrip().startswith(b'<html'):
            raise ValueError(
                "Google Drive returned an HTML page instead of the file. "
                "Please make sure the file is shared as 'Anyone with the link can view' "
                "and try again."
            )

        file_obj = io.BytesIO(file_bytes)
        return UploadFile(filename=filename, file=file_obj)
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to download cloud file: {str(e)}")
