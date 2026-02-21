
import os
import tempfile
from fastapi import UploadFile
import asyncio
from functools import partial
from pdf2docx import Converter
try:
    from docx2pdf import convert as docx2pdf_convert
except ImportError:
    docx2pdf_convert = None
from pypdf import PdfWriter
import fitz  # PyMuPDF
from PIL import Image
import pythoncom

# All temp/output files go into the system temp directory
_TEMP_DIR = tempfile.gettempdir()


async def convert_document(file: UploadFile, source_format: str, target_format: str) -> str:
    # 1. Save input file to temp dir
    temp_filename = os.path.join(_TEMP_DIR, f"xvert_temp_{file.filename}")
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())

    base_name = os.path.splitext(file.filename)[0]
    output_filename = os.path.join(_TEMP_DIR, f"converted_{base_name}.{target_format}")

    def run_conversion():
        try:
            # --- LOGIC: PDF to Word ---
            if source_format == "pdf" and target_format == "docx":
                cv = Converter(temp_filename)
                cv.convert(output_filename, start=0, end=None)
                cv.close()

            # --- LOGIC: Word to PDF ---
            elif source_format in ["docx", "doc"] and target_format == "pdf":
                if docx2pdf_convert:
                    abs_temp = os.path.abspath(temp_filename)
                    abs_output = os.path.abspath(output_filename)
                    try:
                        pythoncom.CoInitialize()
                        docx2pdf_convert(abs_temp, abs_output)
                    except Exception as cx:
                        print(f"DEBUG: docx2pdf failed: {cx}")
                        raise cx
                    finally:
                        try:
                            pythoncom.CoUninitialize()
                        except:
                            pass
                else:
                    raise ImportError("docx2pdf module not installed or available.")

            # --- LOGIC: Image to PDF ---
            elif source_format in ["jpg", "jpeg", "png", "image"] and target_format == "pdf":
                image = Image.open(temp_filename)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                image.save(output_filename, "PDF", resolution=100.0)

            # --- LOGIC: PDF to Image (First Page Only) ---
            elif source_format == "pdf" and target_format in ["jpg", "png"]:
                doc = fitz.open(temp_filename)
                page = doc.load_page(0)
                pix = page.get_pixmap()
                pix.save(output_filename)
                doc.close()
                
            else:
                raise ValueError(f"Conversion from {source_format} to {target_format} not supported in this module.")
        except Exception as e:
            print(f"DEBUG: Run conversion error: {e}")
            raise e

    try:
        await asyncio.to_thread(run_conversion)
    finally:
        # Cleanup input file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return output_filename


async def merge_pdfs(files: list[UploadFile]) -> str:
    temp_files = [] 

    try:
        for file in files:
            temp_name = os.path.join(_TEMP_DIR, f"xvert_temp_{file.filename}")
            with open(temp_name, "wb") as f:
                f.write(await file.read())
            temp_files.append(temp_name)

        def merge_sync():
            merger = PdfWriter()
            for temp_name in temp_files:
                merger.append(temp_name)
            output_filename = os.path.join(_TEMP_DIR, "merged_document.pdf")
            merger.write(output_filename)
            merger.close()
            return output_filename

        output_filename = await asyncio.to_thread(merge_sync)
    
    finally:
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)

    return output_filename