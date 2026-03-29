import os
import tempfile
import asyncio
import traceback
import sys
from pdf2docx import Converter
from functools import partial

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


async def convert_document(file_content: bytes, filename: str, source_format: str, target_format: str) -> str:
    """
    Converts document bytes to target format and returns the ABSOLUTE path to the result.
    """
    # Use a secure temporary directory for all operations
    temp_dir = _TEMP_DIR
    
    # Input file
    suffix = f".{source_format}"
    # Use a safer way to create the temp input file to avoid issues with some converters needing real extensions
    input_path = os.path.join(temp_dir, f"xvert_in_{os.path.basename(filename)}")
    with open(input_path, "wb") as f:
        f.write(file_content)

    # Output file
    output_path = os.path.join(temp_dir, f"converted_{os.path.basename(input_path)}.{target_format}")

    def run_conversion():
        try:
            # --- PDF to Word ---
            if source_format == "pdf" and target_format == "docx":
                cv = Converter(input_path)
                cv.convert(output_path, start=0, end=None)
                cv.close()

            # --- Word to PDF ---
            elif source_format in ["docx", "doc"] and target_format == "pdf":
                if docx2pdf_convert:
                    abs_input = os.path.abspath(input_path)
                    abs_output = os.path.abspath(output_path)
                    try:
                        if pythoncom:
                            pythoncom.CoInitialize()
                        docx2pdf_convert(abs_input, abs_output)
                    except Exception as cx:
                        print(f"DEBUG: docx2pdf failed: {cx}")
                        raise cx
                    finally:
                        if pythoncom:
                            try:
                                pythoncom.CoUninitialize()
                            except:
                                pass
                else:
                    raise ImportError("docx2pdf module not installed or available. Please run: pip install docx2pdf pywin32")

            # --- Image to PDF ---
            elif source_format.lower() in ["jpg", "jpeg", "png", "image"] and target_format == "pdf":
                with Image.open(input_path) as img:
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(output_path, "PDF", resolution=100.0)

            # --- PDF to Image (First Page Only) ---
            elif source_format == "pdf" and target_format.lower() in ["jpg", "png", "jpeg"]:
                doc = fitz.open(input_path)
                page = doc.load_page(0)
                pix = page.get_pixmap()
                pix.save(output_path)
                doc.close()
                
            else:
                raise ValueError(f"Conversion from {source_format} to {target_format} not supported.")
                
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
