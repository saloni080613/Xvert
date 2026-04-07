import os
import sys
import shutil
import subprocess
import tempfile
import asyncio
from fastapi import UploadFile
from pdf2docx import Converter
from pypdf import PdfWriter
import fitz  # PyMuPDF
from PIL import Image
import traceback
from functools import partial

# ---------------------------------------------------------------------------
# LibreOffice headless helper — cross-platform DOCX → PDF
# ---------------------------------------------------------------------------
def _libreoffice_convert_to_pdf(input_path: str, output_dir: str) -> str:
    """
    Convert a DOCX (or any LibreOffice-supported format) to PDF using the
    LibreOffice headless CLI. Works on Linux (Docker/Render) and macOS.
    Falls back to a helpful error on Windows if LibreOffice is not installed.

    Args:
        input_path:  Absolute path to the source DOCX file.
        output_dir:  Directory where LibreOffice will write the output PDF.

    Returns:
        Absolute path to the generated PDF file.

    Raises:
        RuntimeError if LibreOffice is not found or conversion fails.
    """
    # Locate the LibreOffice executable
    lo_cmd = shutil.which("libreoffice") or shutil.which("soffice")
    if lo_cmd is None:
        if sys.platform == "win32":
            # Common Windows install locations
            candidates = [
                r"C:\Program Files\LibreOffice\program\soffice.exe",
                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            ]
            for c in candidates:
                if os.path.isfile(c):
                    lo_cmd = c
                    break
        if lo_cmd is None:
            raise RuntimeError(
                "LibreOffice is not installed or not found in PATH.\n"
                "  Linux/Docker: confirmed installed via apt-get in Dockerfile.\n"
                "  Windows (local dev): install from https://www.libreoffice.org/download/"
            )

    result = subprocess.run(
        [
            lo_cmd,
            "--headless",
            "--norestore",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            input_path,
        ],
        capture_output=True,
        text=True,
        timeout=120,  # 2-minute safety timeout
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"LibreOffice conversion failed (exit {result.returncode}).\n"
            f"stderr: {result.stderr.strip()}"
        )

    # LibreOffice writes <basename>.pdf into output_dir
    base = os.path.splitext(os.path.basename(input_path))[0]
    pdf_path = os.path.join(output_dir, f"{base}.pdf")
    if not os.path.isfile(pdf_path):
        raise RuntimeError(
            f"LibreOffice reported success but output PDF not found at: {pdf_path}"
        )
    return pdf_path

try:
    from docx2pdf import convert as docx2pdf_convert
except ImportError:
    docx2pdf_convert = None

try:
    import pythoncom
except ImportError:
    pythoncom = None

# All temp/output files go into the system temp directory
_TEMP_DIR = tempfile.gettempdir()


async def convert_document(
    file_content: bytes, 
    filename: str, 
    source_format: str, 
    target_format: str,
    # --- NEW PDF TWEAK PARAMETERS ---
    page_range: str = None,
    compress: bool = False
) -> str:
    """
    Converts document bytes to target format and returns the ABSOLUTE path to the result.
    """
    # Use a secure temporary directory for all operations
    temp_dir = _TEMP_DIR
    
    # Input file
    # Ensure filename has the correct extension for the converter libraries to detect the type
    import uuid
    request_id = str(uuid.uuid4())[:8]
    base = os.path.basename(filename)
    if not base.endswith(f".{source_format}"):
        base = f"{base}.{source_format}"
    
    input_path = os.path.join(temp_dir, f"xvert_{request_id}_in_{base}")
    with open(input_path, "wb") as f:
        f.write(file_content)

    # Output file
    output_path = os.path.join(temp_dir, f"xvert_{request_id}_out_{os.path.basename(input_path)}.{target_format}")

    def run_conversion():
        try:
            nonlocal input_path  # Allow reassignment if we pre-slice the PDF

            # --- PRE-CONVERSION: Extract specific pages from PDF before converting ---
            # This runs FIRST so any converter (PDF→DOCX, PDF→Image, etc.) only sees
            # the requested pages, not the entire document.
            if source_format == "pdf" and page_range and page_range.strip():
                import uuid as _uuid
                sliced_path = os.path.join(temp_dir, f"xvert_{request_id}_sliced_{_uuid.uuid4().hex[:6]}.pdf")
                try:
                    src_doc = fitz.open(input_path)
                    sliced_doc = fitz.open()
                    total_pages = src_doc.page_count
                    pages_to_keep = []
                    for part in page_range.strip().split(','):
                        part = part.strip()
                        if not part:
                            continue
                        if '-' in part:
                            start, end = map(int, part.split('-'))
                            pages_to_keep.extend(range(start - 1, end))
                        else:
                            pages_to_keep.append(int(part) - 1)
                    # Clamp to valid page indices
                    pages_to_keep = [p for p in pages_to_keep if 0 <= p < total_pages]
                    if not pages_to_keep:
                        raise ValueError(f"Page range '{page_range}' resulted in no valid pages (document has {total_pages} pages).")
                    for p in pages_to_keep:
                        sliced_doc.insert_pdf(src_doc, from_page=p, to_page=p)
                    sliced_doc.save(sliced_path, garbage=4, deflate=True)
                    sliced_doc.close()
                    src_doc.close()
                    # Replace input so all converters below use the sliced PDF
                    input_path = sliced_path
                except ValueError:
                    raise
                except Exception as e:
                    raise Exception(f"Failed to extract pages: {e}")
            # -----------------------------------------------------------------------

            # --- PDF to Word ---
            if source_format == "pdf" and target_format == "docx":
                cv = Converter(input_path)
                cv.convert(output_path, start=0, end=None)
                cv.close()
                # --- Post-process: fix common symbol substitutions from pdf2docx ---
                try:
                    from docx import Document as _DocxDoc
                    _SYMBOL_FIXES = {
                        '\u25a1': '\u2022',  # □ → •  (most common bullet garble)
                        '\uf0b7': '\u2022',  # Private-use bullet glyph → •
                        '\uf0a7': '\u2022',  # Another common private-use bullet
                        '\u25cf': '\u2022',  # ● → •
                    }
                    _doc = _DocxDoc(output_path)
                    _changed = False
                    for _para in _doc.paragraphs:
                        for _run in _para.runs:
                            _new = _run.text
                            for _bad, _good in _SYMBOL_FIXES.items():
                                _new = _new.replace(_bad, _good)
                            if _new != _run.text:
                                _run.text = _new
                                _changed = True
                    if _changed:
                        _doc.save(output_path)
                except Exception as _fix_err:
                    # Non-fatal: if post-processing fails, the raw pdf2docx output is still returned
                    print(f"DEBUG: symbol fix pass failed (non-fatal): {_fix_err}", file=sys.stderr)


            # --- Word to PDF ---
            elif source_format in ["docx", "doc"] and target_format == "pdf":
                # Priority: docx2pdf (if on Windows with MS Word)
                if sys.platform == "win32" and docx2pdf_convert:
                    abs_input = os.path.abspath(input_path)
                    abs_output = os.path.abspath(output_path)
                    try:
                        if pythoncom:
                            pythoncom.CoInitialize()
                        docx2pdf_convert(abs_input, abs_output)
                    except Exception as cx:
                        print(f"DEBUG: docx2pdf failed: {cx}")
                        # Fallback to LibreOffice if available
                        try:
                            abs_temp = os.path.abspath(input_path)
                            out_dir = os.path.dirname(os.path.abspath(output_path))
                            pdf_path = _libreoffice_convert_to_pdf(abs_temp, out_dir)
                            if os.path.abspath(pdf_path) != os.path.abspath(output_path):
                                os.replace(pdf_path, output_path)
                        except Exception as lx:
                            raise Exception(f"Both docx2pdf and LibreOffice failed.\ndocx2pdf result: {cx}\nLibreOffice result: {lx}")
                    finally:
                        if pythoncom:
                            try:
                                pythoncom.CoUninitialize()
                            except:
                                pass
                else:
                    # Non-Windows or docx2pdf missing: use LibreOffice
                    abs_temp = os.path.abspath(input_path)
                    out_dir = os.path.dirname(os.path.abspath(output_path))
                    pdf_path = _libreoffice_convert_to_pdf(abs_temp, out_dir)
                    # LibreOffice names the file <basename>.pdf; rename to match expected output_path
                    if os.path.abspath(pdf_path) != os.path.abspath(output_path):
                        os.replace(pdf_path, output_path)

            # --- Image to PDF ---
            elif source_format.lower() in ["jpg", "jpeg", "png", "gif", "image", "webp"] and target_format == "pdf":
                with Image.open(input_path) as img:
                    if getattr(img, "n_frames", 1) > 1:
                        img.seek(0)
                    if img.mode in ("RGBA", "LA"):
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        if img.mode == "RGBA":
                            background.paste(img, mask=img.split()[3])
                        else:
                            background.paste(img.convert("RGBA"), mask=img.split()[1])
                        img = background
                    elif img.mode == "P" and "transparency" in img.info:
                        img = img.convert("RGBA")
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[3])
                        img = background
                    elif img.mode != "RGB":
                        img = img.convert("RGB")
                    img.save(output_path, "PDF", resolution=100.0)

            # --- PDF to Image (First Page Only) ---
            elif source_format == "pdf" and target_format.lower() in ["jpg", "png", "jpeg"]:
                doc = fitz.open(input_path)
                page = doc.load_page(0)
                pix = page.get_pixmap()
                pix.save(output_path)
                doc.close()
                
            elif source_format == "pdf" and target_format == "pdf":
                import shutil
                shutil.copy2(input_path, output_path)
                
            else:
                raise ValueError(f"Conversion from {source_format} to {target_format} not supported.")
# --- NEW: PDF TWEAK ENGINE (SPLIT & COMPRESS) ---
            if target_format == "pdf" and (page_range or compress):
                
                target_to_tweak = output_path
                if source_format == "pdf":
                    target_to_tweak = input_path

                if os.path.exists(target_to_tweak):
                    doc = fitz.open(target_to_tweak)
                    new_doc = fitz.open() 
                    
                    try:
                        # Clean up page range just in case Swagger sent spaces
                        clean_range = page_range.strip() if page_range else ""
                        
                        # 1. Handle Page Splitting
                        if clean_range:
                            try:
                                pages_to_keep = []
                                parts = clean_range.split(',')
                                for part in parts:
                                    part = part.strip()
                                    if not part: continue
                                    if '-' in part:
                                        start, end = map(int, part.split('-'))
                                        # Convert 1-based index to 0-based index
                                        pages_to_keep.extend(range(start - 1, end))
                                    else:
                                        pages_to_keep.append(int(part) - 1)
                                
                                # Ensure we don't request a page that doesn't exist
                                total_pages = doc.page_count
                                pages_to_keep = [p for p in pages_to_keep if 0 <= p < total_pages]
                                
                                # Insert specific pages
                                for p in pages_to_keep:
                                    new_doc.insert_pdf(doc, from_page=p, to_page=p)
                                    
                            except ValueError:
                                raise Exception("Invalid page_range format. Use formats like '1-3' or '1,3,5'")
                        else:
                            # If no range specified, just copy all pages
                            new_doc.insert_pdf(doc)

                        # 2. Handle Compression & Save
                        save_options = {
                            "garbage": 4,          # Remove unused objects
                            "deflate": True,       # Compress streams
                        }
                        if compress:
                            # Heavy compression options
                            save_options["clean"] = True
                            
                            save_options["deflate_images"] = True
                            save_options["deflate_fonts"] = True

                        # Overwrite the output path with our new customized PDF
                        new_doc.save(output_path, **save_options)
                        
                    finally:
                        # CRITICAL FIX: Always close handles so Windows can delete the temp files!
                        new_doc.close()
                        doc.close()
            # ------------------------------------------------
            # Final check: did we actually create the file?
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise Exception(f"Conversion failed: Output file missing or empty at {output_path}")

        except Exception as e:
            print(f"DEBUG: run_conversion error: {e}", file=sys.stderr)
            traceback.print_exc()
            raise e

    try:
        await asyncio.to_thread(run_conversion)
    except Exception as e:
        # Log to file for deep debugging
        try:
            with open(os.path.join(temp_dir, "xvert_conversion_error.log"), "a") as f:
                f.write(f"\n--- ERROR {filename} ---\n{traceback.format_exc()}\n")
        except: pass
        raise e
    finally:
        # Cleanup input file
        if os.path.exists(input_path):
            os.remove(input_path)

    return output_path


async def merge_pdfs(files) -> str:
    """
    Merges multiple PDFs (can be UploadFile objects or a list of dicts with 'content'/'name').
    """
    temp_dir = _TEMP_DIR
    temp_files = [] 

    try:
        from pypdf import PdfWriter
        for f in files:
            # Handle both UploadFile (async) and simple objects (sync bytes or from cloud)
            if hasattr(f, 'read'):
                content = await f.read()
            elif isinstance(f, dict) and 'content' in f:
                content = f['content']
            else:
                # If it's already a file object from fetch_cloud_file which returns UploadFile
                content = await f.read()
            
            if content is None: continue
            
            # Create a unique temp file for each part
            prefix = f"xvert_merge_part_{os.urandom(4).hex()}_"
            t_path = os.path.join(temp_dir, prefix + (getattr(f, 'filename', 'part.pdf') if hasattr(f, 'filename') else 'part.pdf'))
            with open(t_path, "wb") as t:
                t.write(content)
            temp_files.append(t_path)

        def merge_sync():
            merger = PdfWriter()
            for tf in temp_files:
                merger.append(tf)
            out_path = os.path.join(temp_dir, f"merged_{os.urandom(4).hex()}.pdf")
            merger.with_open(out_path, "wb") if hasattr(merger, 'with_open') else merger.write(out_path)
            merger.close()
            return out_path

        output_path = await asyncio.to_thread(merge_sync)
        return output_path
    
    finally:
        for tf in temp_files:
            if os.path.exists(tf):
                try:
                    os.remove(tf)
                except: pass

    return output_path
