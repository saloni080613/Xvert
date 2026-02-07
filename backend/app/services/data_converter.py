"""
Data Converter Service
======================
Handles conversion between data formats: JSON, CSV, XLSX, XML.

ARCHITECTURE: Hub-and-Spoke Model
---------------------------------

Instead of writing 12 separate converters (4 formats × 3 targets each),
we use DataFrame as a central hub:

    Input → Reader → DataFrame → Writer → Output

This means we only need:
- 4 readers (to DataFrame)
- 4 writers (from DataFrame)

Benefits:
- Fewer functions to maintain (8 vs 12)
- Adding a new format only requires 2 functions
- DataFrame provides a consistent intermediate representation
- Leverages pandas' optimized I/O operations

CONVERSION FLOW
---------------

1. Client sends file + source_format + target_format
2. Reader function converts source bytes to DataFrame
3. Writer function converts DataFrame to target bytes
4. Return converted bytes to client

SUPPORTED FORMATS
-----------------

| Format | Library | Notes |
|--------|---------|-------|
| JSON   | pandas  | Supports array of objects |
| CSV    | pandas  | Comma-separated with headers |
| XLSX   | pandas + openpyxl | Excel workbook format |
| XML    | pandas + lxml | Element-based structure |
"""

import pandas as pd
from io import BytesIO
from typing import Tuple
import json
import re
from lxml import etree
import xmltodict


# Supported data formats
SUPPORTED_DATA_FORMATS = {"json", "csv", "xlsx", "xml"}


def sanitize_column_name(name: str) -> str:
    """
    Sanitize a column name to be a valid XML tag name.
    
    XML tag rules:
    - Must start with a letter or underscore
    - Can contain letters, digits, hyphens, underscores, periods
    - Cannot contain spaces or special characters like @, :, /
    """
    # Convert to string if not already
    name = str(name)
    
    # Replace common problematic characters with underscores
    name = re.sub(r'[\s@/:;,!#$%^&*()\[\]{}\\|<>?"\'+=-]', '_', name)
    
    # Ensure starts with letter or underscore (not digit or period)
    if name and not re.match(r'^[a-zA-Z_]', name):
        name = '_' + name
    
    # Remove consecutive underscores
    name = re.sub(r'_+', '_', name)
    
    # Remove trailing underscores
    name = name.rstrip('_')
    
    # If empty after sanitization, use a default
    if not name:
        name = 'column'
    
    return name


def sanitize_dataframe_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sanitize all column names in a DataFrame for XML compatibility.
    Handles duplicate column names by appending numbers.
    """
    new_columns = []
    seen = {}
    
    for col in df.columns:
        sanitized = sanitize_column_name(col)
        
        # Handle duplicates by appending a number
        if sanitized in seen:
            seen[sanitized] += 1
            sanitized = f"{sanitized}_{seen[sanitized]}"
        else:
            seen[sanitized] = 0
        
        new_columns.append(sanitized)
    
    df.columns = new_columns
    return df

# MIME types for each format
DATA_MIME_TYPES = {
    "json": "application/json",
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xml": "application/xml",
}


# =============================================================================
# READERS: Convert source format → DataFrame
# =============================================================================

def read_json(file_bytes: bytes) -> pd.DataFrame:
    """
    Read JSON bytes into a DataFrame.
    
    Supports:
    - Array of objects: [{"a": 1}, {"a": 2}] → rows
    - Single object: {"a": 1, "b": 2} → single row
    - Nested objects: Flattened with pd.json_normalize
    
    Args:
        file_bytes: Raw JSON bytes
        
    Returns:
        DataFrame with parsed data
    """
    try:
        # First try to parse as JSON to inspect structure
        data = json.loads(file_bytes.decode('utf-8'))
        
        if isinstance(data, list):
            # Array of objects - use json_normalize to handle nested
            return pd.json_normalize(data)
        elif isinstance(data, dict):
            # Single object - wrap in list for DataFrame
            return pd.json_normalize([data])
        else:
            raise ValueError("JSON must be an object or array of objects")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {str(e)}")


def read_csv(file_bytes: bytes) -> pd.DataFrame:
    """
    Read CSV bytes into a DataFrame.
    
    Assumes:
    - First row contains headers
    - Comma-separated values
    - UTF-8 encoding
    
    Args:
        file_bytes: Raw CSV bytes
        
    Returns:
        DataFrame with parsed data
    """
    try:
        return pd.read_csv(BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Invalid CSV: {str(e)}")


def read_xlsx(file_bytes: bytes) -> pd.DataFrame:
    """
    Read Excel (XLSX) bytes into a DataFrame.
    
    Notes:
    - Reads first sheet only
    - First row treated as headers
    - Preserves data types where possible
    
    Args:
        file_bytes: Raw XLSX bytes
        
    Returns:
        DataFrame with parsed data
    """
    try:
        return pd.read_excel(BytesIO(file_bytes), engine='openpyxl')
    except Exception as e:
        raise ValueError(f"Invalid XLSX: {str(e)}")


def read_xml(file_bytes: bytes) -> pd.DataFrame:
    """
    Read XML bytes into a DataFrame.
    
    Handles:
    - Standard tabular XML with repeating rows
    - Namespaced XML (preserves namespace prefixes as column names)
    - Complex nested structures (flattens to columns)
    
    Strategy:
    1. Try standard pandas read_xml first (for simple tabular XML)
    2. If that fails, use lxml to parse and flatten the XML
       - For repeating structures: each repeat becomes a row
       - For hierarchical structures: flatten all paths to columns
    
    Args:
        file_bytes: Raw XML bytes
        
    Returns:
        DataFrame with parsed data
    """
    # Strategy 1: Try standard pandas parsing for simple tabular XML
    try:
        df = pd.read_xml(BytesIO(file_bytes))
        # Check if we got meaningful data:
        # - Not just namespace attributes
        # - Has actual non-empty values (not just whitespace or NaN)
        if len(df.columns) > 0:
            has_valid_columns = not all(c.startswith('{') or 'xmlns' in str(c).lower() for c in df.columns)
            
            # Check if data has meaningful values (not just whitespace/NaN)
            has_valid_data = False
            for col in df.columns:
                for val in df[col].dropna():
                    if isinstance(val, str) and val.strip():
                        has_valid_data = True
                        break
                    elif not isinstance(val, str) and pd.notna(val):
                        has_valid_data = True
                        break
                if has_valid_data:
                    break
            
            if has_valid_columns and has_valid_data:
                return df
    except Exception:
        pass
    
    # Strategy 2: Parse with lxml and flatten
    try:
        tree = etree.parse(BytesIO(file_bytes))
        root = tree.getroot()
        
        # Find repeating element patterns (like <row>, <item>, <record>)
        # Count element occurrences at each level
        element_counts = {}
        for elem in root.iter():
            # Get the local tag name (without namespace)
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            # Get namespace prefix if exists
            if '}' in elem.tag:
                ns_uri = elem.tag.split('}')[0][1:]  # Remove leading {
                # Find the prefix for this namespace
                prefix = None
                for p, uri in elem.nsmap.items():
                    if uri == ns_uri and p is not None:
                        prefix = p
                        break
                if prefix:
                    tag = f"{prefix}:{tag}"
            
            element_counts[tag] = element_counts.get(tag, 0) + 1
        
        # Find elements that repeat (potential row containers)
        repeating_tags = [tag for tag, count in element_counts.items() if count > 1]
        
        # Method A: Look for repeating elements with text children (tabular data)
        if repeating_tags:
            # Find the deepest repeating elements that have text content children
            for tag in repeating_tags:
                rows = []
                for elem in root.iter():
                    local_tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
                    # Build full tag with prefix
                    full_tag = local_tag
                    if '}' in elem.tag:
                        ns_uri = elem.tag.split('}')[0][1:]
                        for p, uri in (elem.nsmap or {}).items():
                            if uri == ns_uri and p is not None:
                                full_tag = f"{p}:{local_tag}"
                                break
                    
                    if full_tag == tag or local_tag == tag.split(':')[-1]:
                        # Check if this element has children with text
                        row_data = {}
                        for child in elem:
                            child_local = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                            child_tag = child_local
                            if '}' in child.tag:
                                ns_uri = child.tag.split('}')[0][1:]
                                for p, uri in (child.nsmap or {}).items():
                                    if uri == ns_uri and p is not None:
                                        child_tag = f"{p}:{child_local}"
                                        break
                            
                            if child.text and child.text.strip():
                                row_data[child_tag] = child.text.strip()
                        
                        if row_data:
                            rows.append(row_data)
                
                if rows:
                    return pd.DataFrame(rows)
        
        # Method B: Flatten entire XML to a single row with all paths as columns
        # This handles hierarchical XML like the test file
        def flatten_xml(elem, parent_path="", nsmap=None):
            """Recursively flatten XML to {path: value} dict"""
            result = {}
            
            # Get this element's tag with namespace prefix
            local_tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            full_tag = local_tag
            
            if '}' in elem.tag:
                ns_uri = elem.tag.split('}')[0][1:]
                current_nsmap = nsmap if nsmap else {}
                current_nsmap.update(elem.nsmap or {})
                for p, uri in current_nsmap.items():
                    if uri == ns_uri and p is not None:
                        full_tag = f"{p}:{local_tag}"
                        break
            else:
                current_nsmap = nsmap if nsmap else {}
                current_nsmap.update(elem.nsmap or {})
            
            # Build the path
            current_path = f"{parent_path}.{full_tag}" if parent_path else full_tag
            
            # If this element has text content (and no children with text)
            if elem.text and elem.text.strip():
                result[current_path] = elem.text.strip()
            
            # Recurse into children
            for child in elem:
                child_result = flatten_xml(child, current_path, current_nsmap.copy() if current_nsmap else None)
                result.update(child_result)
            
            return result
        
        flattened = flatten_xml(root)
        
        if flattened:
            # Create a single-row DataFrame with all paths as columns
            return pd.DataFrame([flattened])
        else:
            raise ValueError("Could not extract tabular data from XML")
            
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Invalid XML: {str(e)}")


# =============================================================================
# WRITERS: Convert DataFrame → target format
# =============================================================================

def write_json(df: pd.DataFrame) -> bytes:
    """
    Write DataFrame to JSON bytes.
    
    Output format:
    - Array of objects (records orientation)
    - UTF-8 encoded
    - Forward slashes NOT escaped (for readability of URLs etc)
    
    Args:
        df: DataFrame to convert
        
    Returns:
        JSON bytes
    """
    # Convert DataFrame to list of dicts
    records = df.to_dict(orient='records')
    
    # Use json.dumps with ensure_ascii=False to get proper characters
    # The default json.dumps doesn't escape forward slashes (unlike pandas)
    json_str = json.dumps(records, indent=2, ensure_ascii=False, default=str)
    return json_str.encode('utf-8')


def write_csv(df: pd.DataFrame) -> bytes:
    """
    Write DataFrame to CSV bytes.
    
    Output format:
    - Headers in first row
    - Comma-separated
    - No index column
    - UTF-8 encoded
    
    Args:
        df: DataFrame to convert
        
    Returns:
        CSV bytes
    """
    csv_str = df.to_csv(index=False)
    return csv_str.encode('utf-8')


def write_xlsx(df: pd.DataFrame) -> bytes:
    """
    Write DataFrame to Excel (XLSX) bytes.
    
    Output format:
    - Single sheet named 'Sheet1'
    - Headers in first row
    - No index column
    
    Args:
        df: DataFrame to convert
        
    Returns:
        XLSX bytes
    """
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sheet1')
    return output.getvalue()


def write_xml(df: pd.DataFrame) -> bytes:
    """
    Write DataFrame to XML bytes.
    
    Output structure:
    <data>
        <row><col1>value</col1><col2>value</col2></row>
        ...
    </data>
    
    Column names are sanitized to ensure valid XML tag names:
    - Spaces and special characters replaced with underscores
    - Names starting with digits get underscore prefix
    
    Args:
        df: DataFrame to convert
        
    Returns:
        XML bytes
    """
    # Sanitize column names for XML compatibility
    df = sanitize_dataframe_columns(df.copy())
    
    xml_str = df.to_xml(index=False, root_name='data', row_name='row')
    return xml_str.encode('utf-8')


# =============================================================================
# HIERARCHICAL XML ↔ JSON CONVERSION
# =============================================================================
# These functions preserve the tree structure when converting between XML and JSON,
# rather than flattening to a tabular format.

def convert_xml_to_json_hierarchical(file_bytes: bytes) -> Tuple[bytes, int, int]:
    """
    Convert XML to JSON while preserving the hierarchical structure.
    
    Uses xmltodict to create a nested JSON structure that mirrors the XML tree.
    Namespace prefixes are preserved in element names.
    
    Args:
        file_bytes: Raw XML bytes
        
    Returns:
        Tuple of (json_bytes, element_count, depth)
    """
    try:
        # Parse XML to ordered dict
        # process_namespaces=False keeps the namespace prefixes in tag names
        xml_dict = xmltodict.parse(
            file_bytes.decode('utf-8'),
            process_namespaces=False,  # Keep namespace prefixes as-is
            attr_prefix='_',           # Use _ for attributes (like @xmlns -> _xmlns)
        )
        
        # Count elements and calculate depth for metadata
        def count_elements(obj, depth=0):
            """Recursively count elements and find max depth"""
            count = 0
            max_depth = depth
            
            if isinstance(obj, dict):
                count += len(obj)
                for v in obj.values():
                    c, d = count_elements(v, depth + 1)
                    count += c
                    max_depth = max(max_depth, d)
            elif isinstance(obj, list):
                for item in obj:
                    c, d = count_elements(item, depth)
                    count += c
                    max_depth = max(max_depth, d)
            
            return count, max_depth
        
        element_count, depth = count_elements(xml_dict)
        
        # Convert to JSON string
        json_str = json.dumps(xml_dict, indent=2, ensure_ascii=False)
        
        return json_str.encode('utf-8'), element_count, depth
        
    except Exception as e:
        raise ValueError(f"Failed to convert XML to JSON: {str(e)}")


def convert_json_to_xml_hierarchical(file_bytes: bytes) -> Tuple[bytes, int, int]:
    """
    Convert JSON to XML while preserving the hierarchical structure.
    
    Uses xmltodict to create an XML tree from nested JSON.
    The JSON must have a single root element.
    Keys are sanitized to be valid XML tag names.
    
    Args:
        file_bytes: Raw JSON bytes
        
    Returns:
        Tuple of (xml_bytes, element_count, depth)
    """
    def sanitize_keys(obj):
        """Recursively sanitize all keys to be valid XML tag names"""
        if isinstance(obj, dict):
            return {sanitize_column_name(k): sanitize_keys(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [sanitize_keys(item) for item in obj]
        else:
            return obj
    
    try:
        # Parse JSON
        json_data = json.loads(file_bytes.decode('utf-8'))
        
        # Sanitize all keys for XML compatibility
        json_data = sanitize_keys(json_data)
        
        # Ensure we have a dict with a single root
        if isinstance(json_data, list):
            # Wrap list in a root element
            json_data = {"root": {"item": json_data}}
        elif not isinstance(json_data, dict):
            raise ValueError("JSON must be an object or array")
        
        # If dict has multiple keys, wrap in root
        if len(json_data) > 1:
            json_data = {"root": json_data}
        
        # Count elements for metadata
        def count_elements(obj, depth=0):
            count = 0
            max_depth = depth
            
            if isinstance(obj, dict):
                count += len(obj)
                for v in obj.values():
                    c, d = count_elements(v, depth + 1)
                    count += c
                    max_depth = max(max_depth, d)
            elif isinstance(obj, list):
                for item in obj:
                    c, d = count_elements(item, depth)
                    count += c
                    max_depth = max(max_depth, d)
            
            return count, max_depth
        
        element_count, depth = count_elements(json_data)
        
        # Convert to XML
        xml_str = xmltodict.unparse(json_data, pretty=True, encoding='utf-8')
        
        return xml_str if isinstance(xml_str, bytes) else xml_str.encode('utf-8'), element_count, depth
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to convert JSON to XML: {str(e)}")


# =============================================================================
# MAIN CONVERSION FUNCTION
# =============================================================================

# Reader and writer mappings
READERS = {
    "json": read_json,
    "csv": read_csv,
    "xlsx": read_xlsx,
    "xml": read_xml,
}

WRITERS = {
    "json": write_json,
    "csv": write_csv,
    "xlsx": write_xlsx,
    "xml": write_xml,
}



def convert_data(
    file_bytes: bytes,
    source_format: str,
    target_format: str,
) -> Tuple[bytes, int, int]:
    """
    Convert data from one format to another using DataFrame as hub.
    
    Flow: Source → Reader → DataFrame → Writer → Target
    
    Args:
        file_bytes: Raw bytes of the source file
        source_format: Source format (json, csv, xlsx, xml)
        target_format: Target format (json, csv, xlsx, xml)
        
    Returns:
        Tuple of (converted_bytes, row_count, column_count)
        
    Raises:
        ValueError: If format is unsupported or file is malformed
    """
    # Normalize formats
    source_format = source_format.lower()
    target_format = target_format.lower()
    
    # Validate formats
    if source_format not in SUPPORTED_DATA_FORMATS:
        raise ValueError(f"Unsupported source format: {source_format}")
    if target_format not in SUPPORTED_DATA_FORMATS:
        raise ValueError(f"Unsupported target format: {target_format}")
    
    # Special case: XML → JSON should preserve hierarchical structure
    # This bypasses the DataFrame hub for a direct conversion
    if source_format == "xml" and target_format == "json":
        return convert_xml_to_json_hierarchical(file_bytes)
    
    # Special case: JSON → XML should preserve hierarchical structure  
    if source_format == "json" and target_format == "xml":
        return convert_json_to_xml_hierarchical(file_bytes)
    
    # Standard hub-and-spoke: Source → DataFrame → Target
    # Step 1: Read source to DataFrame
    reader = READERS[source_format]
    df = reader(file_bytes)
    
    # Step 2: Write DataFrame to target
    writer = WRITERS[target_format]
    output_bytes = writer(df)
    
    return output_bytes, len(df), len(df.columns)


def validate_data_format(format: str) -> bool:
    """Check if a data format is supported."""
    return format.lower() in SUPPORTED_DATA_FORMATS


def get_data_content_type(format: str) -> str:
    """Get the MIME type for a data format."""
    return DATA_MIME_TYPES.get(format.lower(), "application/octet-stream")