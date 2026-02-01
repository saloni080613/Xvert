import pandas as pd
import os
from fastapi import UploadFile

async def convert_data(file: UploadFile, source_format: str, target_format: str) -> str:
    # 1. Load the data
    if source_format == "csv":
        df = pd.read_csv(file.file)
    elif source_format == "json":
        df = pd.read_json(file.file)
    elif source_format == "xlsx":
        df = pd.read_excel(file.file)
    else:
        raise ValueError("Unsupported source format")

    # 2. Save to target format
    output_filename = f"converted_data.{target_format}"
    
    if target_format == "csv":
        df.to_csv(output_filename, index=False)
    elif target_format == "json":
        df.to_json(output_filename, orient="records")
    elif target_format == "xlsx":
        df.to_excel(output_filename, index=False)
    
    return output_filename