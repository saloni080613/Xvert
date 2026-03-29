"""
Compat shim for BatchConverter
================================
document_converter.convert_document() expects a FastAPI UploadFile object.
This lightweight shim mimics just the interface it needs:
  - .filename
  - await .read()
  - await .seek(0)
"""

import io


class BytesUploadFile:
    """Minimal UploadFile stand-in that wraps raw bytes."""

    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self._buf = io.BytesIO(content)

    async def read(self) -> bytes:
        return self._buf.read()

    async def seek(self, pos: int):
        self._buf.seek(pos)
