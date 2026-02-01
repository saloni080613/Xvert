import os
import markdown
from fastapi import UploadFile

async def convert_document(file: UploadFile, source_format: str, target_format: str) -> str:
    # 1. Save uploaded file temporarily
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())

    output_filename = f"converted_{os.path.splitext(file.filename)[0]}.{target_format}"

    # 2. Logic for Markdown -> HTML
    if source_format == "md" and target_format == "html":
        with open(temp_filename, "r", encoding="utf-8") as f:
            text = f.read()
            html = markdown.markdown(text)
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(html)
    
    # TODO: We will add PDF <-> Word logic here in the next step

    # 3. Cleanup
    if os.path.exists(temp_filename):
        os.remove(temp_filename)
    
    return output_filename