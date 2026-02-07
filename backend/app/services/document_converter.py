
import os
from fastapi import UploadFile
from pdf2docx import Converter
from pypdf import PdfWriter
import fitz  # PyMuPDF
from PIL import Image

async def convert_document(file: UploadFile, source_format: str, target_format: str) -> str:
    # 1. Save input file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())

    base_name = os.path.splitext(file.filename)[0]
    output_filename = f"converted_{base_name}.{target_format}"

    try:
        # --- LOGIC: PDF to Word ---
        if source_format == "pdf" and target_format == "docx":
            cv = Converter(temp_filename)
            cv.convert(output_filename, start=0, end=None)
            cv.close()

        # --- LOGIC: Image to PDF ---
        elif source_format in ["jpg", "jpeg", "png"] and target_format == "pdf":
            image = Image.open(temp_filename)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image.save(output_filename)

        # --- LOGIC: PDF to Image (First Page Only for MVP) ---
        elif source_format == "pdf" and target_format in ["jpg", "png"]:
            doc = fitz.open(temp_filename)
            page = doc.load_page(0)  # Get first page
            pix = page.get_pixmap()
            pix.save(output_filename)
            doc.close()
            
        else:
            raise ValueError(f"Conversion from {source_format} to {target_format} not supported in this module.")

    finally:
        # Cleanup input file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return output_filename

async def merge_pdfs(files: list[UploadFile]) -> str:
    merger = PdfWriter()
    temp_files = []

    try:
        for file in files:
            temp_name = f"temp_{file.filename}"
            with open(temp_name, "wb") as f:
                f.write(await file.read())
            temp_files.append(temp_name)
            merger.append(temp_name)

        output_filename = "merged_document.pdf"
        merger.write(output_filename)
        merger.close()
    
    finally:
        # Cleanup all temp files
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)

    return output_filename