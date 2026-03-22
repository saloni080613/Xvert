
import os
from fastapi import UploadFile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from functools import partial
from pdf2docx import Converter
from pypdf import PdfWriter
import fitz  # PyMuPDF
from pypdf import PdfWriter
import fitz  # PyMuPDF
from PIL import Image
import pythoncom

async def convert_document(file: UploadFile, source_format: str, target_format: str) -> str:
    # 1. Save input file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())

    base_name = os.path.splitext(file.filename)[0]
    output_filename = f"converted_{base_name}.{target_format}"

    def run_conversion():
        try:
            # --- LOGIC: PDF to Word ---
            if source_format == "pdf" and target_format == "docx":
                cv = Converter(temp_filename)
                cv.convert(output_filename, start=0, end=None)
                cv.close()

            # --- LOGIC: Word to PDF ---
            elif source_format in ["docx", "doc"] and target_format == "pdf":
                try:
                    from docx2pdf import convert as docx2pdf_convert
                except ImportError:
                    print("DEBUG: docx2pdf module not loaded")
                    raise ImportError("docx2pdf module not installed. Please run: pip install docx2pdf pywin32")

                # docx2pdf requires absolute paths usually
                abs_temp = os.path.abspath(temp_filename)
                abs_output = os.path.abspath(output_filename)
                print(f"DEBUG: Converting {abs_temp} to {abs_output}")
                try:
                    # Initialize COM for this thread (Critical for FastAPI/Uvicorn)
                    import pythoncom
                    pythoncom.CoInitialize()
                    docx2pdf_convert(abs_temp, abs_output)
                    print("DEBUG: Conversion successful")
                except Exception as cx:
                    print(f"DEBUG: docx2pdf failed: {cx}")
                    raise cx
                finally:
                    # Uninitialize COM
                    try:
                        import pythoncom
                        pythoncom.CoUninitialize()
                    except:
                        pass

            # --- LOGIC: Image to PDF ---
            elif source_format in ["jpg", "jpeg", "png", "image"] and target_format == "pdf":
                image = Image.open(temp_filename)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                image.save(output_filename, "PDF", resolution=100.0)

            # --- LOGIC: PDF to Image (First Page Only for MVP) ---
            elif source_format == "pdf" and target_format in ["jpg", "png"]:
                doc = fitz.open(temp_filename)
                page = doc.load_page(0)  # Get first page
                pix = page.get_pixmap()
                pix.save(output_filename)
                doc.close()
                
            else:
                raise ValueError(f"Conversion from {source_format} to {target_format} not supported in this module.")
        except Exception as e:
            print(f"DEBUG: Run conversion error: {e}")
            raise e

    try:
        # Run synchronous conversion in a separate thread to avoid blocking the event loop
        await asyncio.to_thread(run_conversion)
    finally:
        # Cleanup input file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return output_filename

async def merge_pdfs(files: list[UploadFile]) -> str:
    temp_files = [] 

    try:
        # 1. Write all files to temp storage (IO bound, okay in async)
        for file in files:
            temp_name = f"temp_{file.filename}"
            with open(temp_name, "wb") as f:
                f.write(await file.read())
            temp_files.append(temp_name)

        # 2. Run merge in thread (CPU bound)
        def merge_sync():
            merger = PdfWriter()
            for temp_name in temp_files:
                merger.append(temp_name)
            output_filename = "merged_document.pdf"
            merger.write(output_filename)
            merger.close()
            return output_filename

        output_filename = await asyncio.to_thread(merge_sync)
    
    finally:
        # Cleanup all temp files
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)

    return output_filename