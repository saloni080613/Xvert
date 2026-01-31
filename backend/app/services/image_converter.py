"""
Image Converter Service
======================
Handles image format conversion using Pillow (PIL).

THEORY OF IMAGE CONVERSION
--------------------------

1. **How Digital Images Work**
   - Images are stored as a 2D grid of pixels
   - Each pixel has color data (RGB, RGBA, or indexed palette)
   - Different formats compress/store this data differently

2. **Format Characteristics**

   PNG (Portable Network Graphics):
   - Lossless compression (no quality loss)
   - Supports transparency (alpha channel - RGBA)
   - Best for: logos, icons, screenshots, graphics with sharp edges
   - Mode: typically RGBA (4 channels) or RGB (3 channels)

   JPG/JPEG (Joint Photographic Experts Group):
   - Lossy compression (some quality loss for smaller size)
   - NO transparency support (only RGB, no alpha)
   - Best for: photographs, gradients, real-world images
   - Mode: RGB only (3 channels)

   GIF (Graphics Interchange Format):
   - Limited to 256 colors (indexed palette)
   - Supports animation (multiple frames)
   - Supports simple transparency (1-bit: fully transparent or opaque)
   - Best for: simple animations, low-color graphics
   - Mode: P (palette/indexed) or RGB

3. **Conversion Challenges & Solutions**

   PNG → JPG:
   - Problem: PNG may have transparency, JPG doesn't support it
   - Solution: Flatten alpha onto white background, convert to RGB mode
   
   GIF → PNG/JPG:
   - Problem: GIF may be animated (multiple frames)
   - Solution: Extract first frame only for static conversion
   
   Any → GIF:
   - Problem: GIF supports only 256 colors
   - Solution: Quantize colors using palette conversion

4. **The Conversion Process**
   Step 1: Read source image bytes into PIL Image object
   Step 2: Handle mode conversion (RGBA → RGB, P → RGB, etc.)
   Step 3: Handle transparency (composite onto background)
   Step 4: Save to target format with appropriate options
   Step 5: Return the converted bytes
"""

from PIL import Image
from io import BytesIO
from typing import Tuple, Optional


# Supported formats for conversion
SUPPORTED_FORMATS = {"png", "jpg", "jpeg", "gif"}

# MIME types for each format
MIME_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
}


def convert_image(
    file_bytes: bytes,
    source_format: Optional[str],
    target_format: str,
    quality: int = 95
) -> Tuple[bytes, str]:
    """
    Convert an image from one format to another.
    
    Args:
        file_bytes: Raw bytes of the source image
        source_format: Source format (optional, can be auto-detected)
        target_format: Target format to convert to
        quality: JPEG quality (1-100), only used for JPG/JPEG output
    
    Returns:
        Tuple of (converted_bytes, detected_source_format)
    
    Theory:
        The conversion process involves:
        1. Loading raw bytes into a PIL Image object
        2. Detecting/validating the source format
        3. Converting color modes as needed (RGBA→RGB for JPEG)
        4. Handling transparency by compositing onto a background
        5. Saving to the target format with appropriate settings
    """
    # Normalize format to lowercase
    target_format = target_format.lower()
    if target_format not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported target format: {target_format}. Supported: {SUPPORTED_FORMATS}")
    
    # Load image from bytes
    # PIL automatically detects the format from the file header (magic bytes)
    image = Image.open(BytesIO(file_bytes))
    
    # Detect source format if not provided
    detected_format = image.format.lower() if image.format else None
    if source_format:
        source_format = source_format.lower()
        # Normalize jpeg to jpg for consistency
        if source_format == "jpeg":
            source_format = "jpg"
    else:
        source_format = detected_format
        if source_format == "jpeg":
            source_format = "jpg"
    
    # Validate source format
    if source_format not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported source format: {source_format}. Supported: {SUPPORTED_FORMATS}")
    
    # Handle animated GIFs - extract first frame only
    # GIFs store multiple frames, but static formats only support one
    if hasattr(image, 'n_frames') and image.n_frames > 1:
        image.seek(0)  # Go to first frame
    
    # Prepare image for target format
    image = _prepare_for_target_format(image, target_format)
    
    # Save to bytes
    output_buffer = BytesIO()
    save_kwargs = _get_save_options(target_format, quality)
    
    # PIL uses 'JPEG' internally, not 'JPG'
    pil_format = "JPEG" if target_format in ("jpg", "jpeg") else target_format.upper()
    image.save(output_buffer, format=pil_format, **save_kwargs)
    
    return output_buffer.getvalue(), source_format


def _prepare_for_target_format(image: Image.Image, target_format: str) -> Image.Image:
    """
    Prepare an image for the target format by handling color modes and transparency.
    
    Theory:
        Different formats support different color modes:
        - JPEG: Only RGB (no transparency)
        - PNG: RGB, RGBA, P, L, LA (full transparency support)
        - GIF: P (palette), RGB (converted to palette)
        
        When converting, we must:
        1. Handle alpha channel removal for JPEG (flatten onto white)
        2. Handle palette mode conversion for PNG/JPEG
        3. Handle color quantization for GIF
    """
    if target_format in ("jpg", "jpeg"):
        # JPEG doesn't support transparency - must convert to RGB
        # If image has alpha channel, composite onto white background
        if image.mode in ("RGBA", "LA"):
            # Create white background
            background = Image.new("RGB", image.size, (255, 255, 255))
            # Paste image onto background using alpha as mask
            if image.mode == "RGBA":
                background.paste(image, mask=image.split()[3])  # Alpha is 4th channel
            else:  # LA mode
                background.paste(image.convert("RGBA"), mask=image.split()[1])
            image = background
        elif image.mode == "P":
            # Palette mode - check if it has transparency
            if "transparency" in image.info:
                image = image.convert("RGBA")
                background = Image.new("RGB", image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3])
                image = background
            else:
                image = image.convert("RGB")
        elif image.mode != "RGB":
            # Convert any other mode (L, 1, etc.) to RGB
            image = image.convert("RGB")
    
    elif target_format == "png":
        # PNG supports all modes, but normalize for consistency
        if image.mode == "P":
            # Keep palette mode or convert based on transparency
            if "transparency" in image.info:
                image = image.convert("RGBA")
        elif image.mode not in ("RGB", "RGBA", "L", "LA"):
            image = image.convert("RGBA")
    
    elif target_format == "gif":
        # GIF requires palette mode (max 256 colors)
        # Convert to palette using adaptive quantization
        if image.mode == "RGBA":
            # Preserve transparency in GIF
            # First, convert to P mode with transparency
            image = image.convert("P", palette=Image.ADAPTIVE, colors=255)
        elif image.mode != "P":
            image = image.convert("P", palette=Image.ADAPTIVE, colors=256)
    
    return image


def _get_save_options(target_format: str, quality: int) -> dict:
    """
    Get format-specific save options.
    
    Theory:
        Each format has different save options:
        - JPEG: quality (1-100), optimize for smaller file
        - PNG: optimize for compression
        - GIF: no special options needed
    """
    options = {}
    
    if target_format in ("jpg", "jpeg"):
        options["quality"] = quality
        options["optimize"] = True
    elif target_format == "png":
        options["optimize"] = True
    
    return options


def get_mime_type(format: str) -> str:
    """Get the MIME type for a given format."""
    return MIME_TYPES.get(format.lower(), "application/octet-stream")


def validate_format(format: str) -> bool:
    """Check if a format is supported."""
    return format.lower() in SUPPORTED_FORMATS
