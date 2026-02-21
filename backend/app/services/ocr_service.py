"""
OCR Service
============
Converts scanned PDFs to editable DOCX documents using:
  - PyMuPDF (fitz)   → render PDF pages as images
  - pytesseract      → extract text from page images
  - python-docx      → build the output DOCX

Optimised pipeline:
  1. Render at 300 DPI
  2. Grayscale → sharpen → adaptive threshold → denoise
  3. OCR with page-segmentation mode 6 (uniform block of text)
  4. Post-process text (strip artefacts, normalise whitespace)
"""

import os
import re
import tempfile
import fitz  # PyMuPDF
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_BREAK

# ---------------------------------------------------------------------------
# Auto-detect Tesseract on Windows if it's not already on PATH
# ---------------------------------------------------------------------------
_COMMON_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\{user}\AppData\Local\Tesseract-OCR\tesseract.exe",
]

def _configure_tesseract():
    """Try to locate tesseract.exe if it is not already on PATH."""
    try:
        pytesseract.get_tesseract_version()
        return
    except Exception:
        pass

    username = os.environ.get("USERNAME", "")
    for path_template in _COMMON_TESSERACT_PATHS:
        path = path_template.replace("{user}", username)
        if os.path.isfile(path):
            pytesseract.pytesseract.tesseract_cmd = path
            return

_configure_tesseract()


# ---------------------------------------------------------------------------
# Image pre-processing helpers
# ---------------------------------------------------------------------------
def _preprocess_image(img: Image.Image) -> Image.Image:
    """
    Apply a chain of enhancements to maximise OCR accuracy.
    """
    # 1. Convert to grayscale
    img = img.convert("L")

    # 2. Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)

    # 3. Sharpen to make edges crisper
    img = img.filter(ImageFilter.SHARPEN)

    # 4. Adaptive binarisation via simple threshold
    #    (converts to pure black/white — best for OCR)
    threshold = 140
    img = img.point(lambda p: 255 if p > threshold else 0, mode="1")

    # 5. Convert back to L mode for pytesseract compatibility
    img = img.convert("L")

    return img


def _clean_text(raw: str) -> str:
    """Post-process OCR output for cleaner results."""
    # Collapse multiple blank lines into one
    text = re.sub(r"\n{3,}", "\n\n", raw)
    # Remove stray non-printable characters
    text = re.sub(r"[^\S\n]+", " ", text)
    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(lines).strip()


# ---------------------------------------------------------------------------
# Core OCR function
# ---------------------------------------------------------------------------
async def ocr_pdf_to_docx(input_path: str) -> str:
    """
    Convert a scanned PDF to an editable DOCX via OCR.

    Returns:
        Path to the generated DOCX file (inside system temp dir).
    """
    # Verify Tesseract is available
    try:
        pytesseract.get_tesseract_version()
    except Exception:
        raise RuntimeError(
            "Tesseract OCR engine is not installed. "
            "Download it from https://digi.bib.uni-mannheim.de/tesseract/ "
            "and ensure it is on your PATH."
        )

    doc = fitz.open(input_path)
    docx_doc = Document()

    # Style: use a readable font
    style = docx_doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    # Custom OCR config for better accuracy
    # --psm 6  = Assume a single uniform block of text
    # --oem 3  = Use default LSTM neural net engine
    custom_config = r"--oem 3 --psm 6"

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

        # Render page at 300 DPI for good OCR quality
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Pre-process for best OCR results
        img_processed = _preprocess_image(img)

        # Run OCR with custom config
        raw_text = pytesseract.image_to_string(
            img_processed, lang="eng", config=custom_config
        )

        cleaned = _clean_text(raw_text)

        # Add text to DOCX — split by paragraphs for natural formatting
        if cleaned:
            paragraphs = cleaned.split("\n\n")
            for i, para_text in enumerate(paragraphs):
                if para_text.strip():
                    docx_doc.add_paragraph(para_text.strip())
        else:
            docx_doc.add_paragraph("[No text detected on this page]")

        # Add page break between pages (except after the last one)
        if page_num < len(doc) - 1:
            docx_doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    doc.close()

    # Write output DOCX to temp directory (NOT cwd)
    base = os.path.splitext(os.path.basename(input_path))[0]
    # Strip any "temp_ocr_" prefix that the router may have added
    base = re.sub(r"^temp_ocr_", "", base)
    output_path = os.path.join(tempfile.gettempdir(), f"ocr_{base}.docx")
    docx_doc.save(output_path)
    return output_path
