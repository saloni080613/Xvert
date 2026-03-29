# Xvert — Project Status Report

> **Date**: February 17, 2026  
> **Project**: Xvert — Universal File Bridge  
> **Stack**: React (Vite) + FastAPI + Supabase

---

## Table of Contents

1. [What's Done ✅](#1-whats-done-)
2. [What Needs to Change 🔧](#2-what-needs-to-change-)
3. [What Needs to Be Added 🚀](#3-what-needs-to-be-added-)

---

## 1. What's Done ✅

### 1.1 Frontend — React (Vite)

| Feature | Status | Details |
|---------|--------|---------|
| **Project Setup** | ✅ Done | Vite + React 19, ESLint, routing via `react-router-dom` |
| **UI Design System** | ✅ Done | Glassmorphism theme, CSS variables, dark/light mode toggle (`ThemeContext.jsx`) |
| **Navbar** | ✅ Done | Responsive navbar with tool search via mega-menu (`Navbar.jsx`, `MegaMenu.jsx`) |
| **Footer** | ✅ Done | Three footer variants: `Footer.jsx`, `MegaFooter.jsx`, `MiniFooter.jsx` |
| **Toast Notifications** | ✅ Done | Context-based toast system (`ToastContext.jsx`) |
| **Home Page** | ✅ Done | Tool grid with category tabs (Documents/Images/Data), search bar (`Ctrl+K`), file preview, orbital progress ring, recent conversions widget |
| **Smart Router** | ✅ Done | Drop any file → auto-detects type → shows relevant output formats (extension-to-tool mapping) |
| **Image Conversion UI** | ✅ Done | JPG ↔ PNG ↔ GIF conversions via `ConversionService.convertImage()` |
| **Data Conversion UI** | ✅ Done | JSON ↔ CSV ↔ XLSX ↔ XML (12 combinations) via `ConversionService.convertData()` |
| **Document Conversion UI** | ✅ Done | PDF ↔ DOCX, Image → PDF, PDF → JPG/PNG via `ConversionService.convertDocument()` |
| **PDF Merge UI** | ✅ Done | Multi-file upload + merge via `ConversionService.mergeDocuments()` |
| **Auth — Login/Signup** | ✅ Done | Email/password auth + Google OAuth via Supabase (`AuthService.js`) |
| **Auth — Password Reset** | ✅ Done | Forgot Password + Update Password pages and flows |
| **User Profile** | ✅ Done | `Profile.jsx` page with session data |
| **Conversion History** | ✅ Done | `History.jsx` page fetching from backend `/api/convert/history` |
| **About Page** | ✅ Done | `About.jsx` informational page |
| **Animations** | ✅ Done | `framer-motion` spring animations, staggered grid, drag-and-drop, `AntiGravityBackground.jsx` with floating particles |
| **Skeleton Loader** | ✅ Done | `SkeletonLoader.jsx` for loading states |
| **Keyboard Shortcuts** | ✅ Done | `Ctrl+K` (search), `Escape` (back), `Enter` (convert) |
| **Responsive Layout** | ✅ Done | Flexbox layout with `minHeight: 100vh`, mobile-friendly |
| **File Drag & Drop** | ✅ Done | Smart Router drop zone + individual tool drop zone (native `onDrop`, `react-dropzone` available) |

### 1.2 Backend — FastAPI

| Feature | Status | Details |
|---------|--------|---------|
| **Project Setup** | ✅ Done | FastAPI + Uvicorn, CORS configured, `.env` support |
| **Image Conversion API** | ✅ Done | `POST /api/convert/image` — PNG, JPG, JPEG, GIF via Pillow. Handles transparency (RGBA→RGB), palette mode, GIF quantization |
| **Data Conversion API** | ✅ Done | `POST /api/convert/data` — JSON, CSV, XLSX, XML. Hub-and-Spoke architecture via Pandas with column sanitization for XML |
| **Document Conversion API** | ✅ Done | `POST /api/convert/document` — PDF↔DOCX (`pdf2docx`, `docx2pdf`), Image→PDF (Pillow), PDF→JPG/PNG (PyMuPDF) |
| **PDF Merge API** | ✅ Done | `POST /api/convert/merge` — Merge multiple PDFs via `pypdf` |
| **Conversion History** | ✅ Done | `GET /api/convert/history` + `GET /api/convert/history/{filename}` — Local file-based history in `history/` directory |
| **Supported Formats API** | ✅ Done | `GET /api/convert/formats` and `GET /api/convert/data-formats` |
| **File Utilities** | ✅ Done | `file_utils.py` — filename sanitization, format detection, output naming, file size validation, history management |
| **Supabase Service** | ✅ Done | `supabase_service.py` — Client initialized from env vars (currently used for auth only) |
| **Health Check** | ✅ Done | `GET /health` endpoint |
| **Async Processing** | ✅ Done | `asyncio.to_thread()` for blocking operations (document conversion, PDF merge) |

### 1.3 Infrastructure & Tooling

| Feature | Status | Details |
|---------|--------|---------|
| **Supabase Auth** | ✅ Done | Email/password + Google OAuth, session management |
| **Git Repository** | ✅ Done | `.gitignore` configured |
| **Documentation** | ✅ Done | `docs/` folder with `IMAGE_CONVERSION_API.md`, `DATA_CONVERSION_API.md`, `SETUP_WALKTHROUGH.md`, `GIT_WORKFLOW.md`, `UX_UI_CHANGES.md` |
| **Startup Script** | ✅ Done | `start_app.ps1` — PowerShell script to start both frontend and backend |

---

## 2. What Needs to Change 🔧

### 2.1 Architecture & Code Quality

| Issue | Where | What to Change |
|-------|-------|----------------|
| **Duplicate route declarations in `App.jsx`** | `frontend/src/App.jsx` | Routes are defined in both `AppContent` and `App` components. `AppContent` uses `useLocation()` without being wrapped in `<Router>`. Remove duplicate `Routes` block in `App`, wrap `AppContent` inside `Router` properly. |
| **Duplicate router initialization** | `backend/app/routers/convert.py` (line 53-54) | `router = APIRouter()` is declared twice. Remove the duplicate. |
| **Duplicate imports** | `backend/app/services/document_converter.py` | `from functools import partial` imported twice; `PdfWriter` and `fitz` imported twice each. Clean up. |
| **Duplicate return statement** | `backend/app/utils/file_utils.py` (line 201-202) | `get_data_content_type()` has two identical `return` statements. Remove the duplicate. |
| **Hardcoded API URL in HistoryService** | `frontend/src/services/HistoryService.js` | `API_URL` is hardcoded to `http://localhost:8000`. Should use `import.meta.env.VITE_API_URL` like `ConversionService.js`. |
| **No file auto-deletion (Privacy)** | Backend | Plan calls for **"Zero-Persistence"** with 30-min auto-delete. Currently, converted files in `history/` persist forever. Need a scheduled cleanup task. |
| **Local file-based history** | `backend/app/utils/file_utils.py` | History is saved to local filesystem (`history/` dir). For cloud deployment and scalability, migrate to **Supabase Storage Buckets**. |
| **No file size limits enforced** | Backend routers | `validate_file_size()` exists in `file_utils.py` but is never called in any router. Should enforce the 50MB `MAX_FILE_SIZE` limit. |
| **Missing Dashboard integration** | `frontend/src/pages/Dashboard.jsx` | Dashboard page exists (27KB) but is **not routed** in `App.jsx`. It's orphaned. Add route or integrate into Profile/History. |
| **Simulated progress bar** | `frontend/src/pages/Home.jsx` | Progress bar increments on a timer (`+5` every 500ms), not based on actual upload/conversion progress. Should use `axios` `onUploadProgress` callback for real progress. |

### 2.2 Security & Robustness

| Issue | What to Change |
|-------|----------------|
| **No input validation on backend** | Add file-type validation (MIME type check), not just extension. Prevent malicious uploads. |
| **Temp files not always cleaned** | `document_converter.py` writes temp files; output files are never deleted after response. Use FastAPI `BackgroundTasks` for cleanup. |
| **CORS too permissive** | `allow_methods=["*"]`, `allow_headers=["*"]` — tighten for production. |
| **No rate limiting** | Add rate limiting to prevent abuse (e.g., `slowapi` or Supabase edge functions). |

---

## 3. What Needs to Be Added 🚀

### 3.1 Audio/Video Conversion (HIGH PRIORITY)

> **Current State**: No audio/video support exists. The plan calls for full Media coverage.

#### How to Implement

1. **Install FFmpeg** on the server (system dependency, not pip).
2. **Create `backend/app/services/media_converter.py`**
   - Use `ffmpeg-python` (pip package) as a Python wrapper around FFmpeg.
   - Support conversions: MP4 ↔ AVI ↔ MKV ↔ WEBM, MP3 ↔ WAV ↔ AAC ↔ OGG.
   - Support **extract audio from video** (MP4 → MP3).
   - Support **resolution/bitrate changes** via parameters.
   ```python
   import ffmpeg

   async def convert_media(file_bytes, source_format, target_format, options=None):
       # Write to temp, run ffmpeg, read output, return bytes
   ```
3. **Create `backend/app/routers/media.py`**
   - `POST /api/convert/media` endpoint.
   - Accept `file`, `target_format`, optional `resolution`, `bitrate`, `audio_only` params.
4. **Register router** in `main.py`:
   ```python
   from app.routers import media
   app.include_router(media.router, prefix="/api/convert", tags=["media"])
   ```
5. **Frontend**: Add media tools to the `tools[]` array in `Home.jsx`, add `convertMedia()` to `ConversionService.js`, update Smart Router `extMap` with video/audio extensions.

---

### 3.2 Parallel Batch Processing (HIGH PRIORITY)

> **Current State**: Upload handles one file at a time (except PDF merge). Plan calls for "Upload 20 images at once with 20 individual progress bars."

#### How to Implement

1. **Backend** — Already uses `async` + `to_thread()`, so it can handle concurrent requests.
2. **Frontend** — Refactor `Home.jsx` conversion flow:
   - Allow multi-file selection for image/data tools (not just PDF merge).
   - Track each file's status independently: `{ file, status, progress, downloadUrl, error }`.
   - Fire parallel conversion API calls (`Promise.allSettled()`).
   - Show individual progress bars per file using the `OrbitalProgress` component.
   - Add a **"Download All as ZIP"** option (use `JSZip` library on frontend).
3. **Backend** — Add a batch endpoint:
   ```python
   @router.post("/api/convert/batch")
   async def batch_convert(files: List[UploadFile], target_format: str):
       # Process all files concurrently with asyncio.gather()
   ```

---

### 3.3 Format Tweak Menu — Advanced Parameter Control (MEDIUM PRIORITY)

> **Current State**: No parameter controls exist. Conversion uses defaults only.

#### How to Implement

1. **Create `frontend/src/components/SettingsDrawer.jsx`** (Note: `SettingsPanel.jsx` exists but is for app settings, not conversion params).
   - **Image options**: Quality slider (1–100), resize (width × height), crop toggle.
   - **Video options**: Resolution dropdown (1080p/720p/480p), bitrate slider, audio-only checkbox.
   - **PDF options**: Compression level, page range picker (for split), merge order drag-and-drop.
2. **Backend** — Extend endpoints to accept optional params:
   ```python
   @router.post("/api/convert/image")
   async def convert_image(
       file: UploadFile,
       target_format: str = Form(...),
       quality: int = Form(95),
       width: Optional[int] = Form(None),
       height: Optional[int] = Form(None),
   ):
   ```
3. **Image service** — Already accepts `quality` param. Add `resize` using Pillow's `image.resize()` and add EXIF handling.
4. **PDF tools** — Add split endpoint (`POST /api/convert/split-pdf`) using `pypdf.PdfWriter` to extract page ranges.

---

### 3.4 Supabase Storage Integration (MEDIUM PRIORITY)

> **Current State**: Supabase is used for auth only. Storage Buckets and Realtime are not used.

#### How to Implement

1. **Create Supabase Storage Bucket** named `conversions` in Supabase dashboard.
2. **Modify backend** — After conversion, upload result to Supabase Storage:
   ```python
   from app.services.supabase_service import get_supabase

   supabase = get_supabase()
   supabase.storage.from_("conversions").upload(file_path, file_bytes)
   ```
3. **Generate signed URLs** (30-min expiry) for downloads instead of serving files directly.
4. **Add a cron job / background task** to delete files from the bucket after 30 minutes (fulfills **Zero-Persistence**).
5. **Realtime notifications** — Use Supabase Realtime to push "Conversion Complete" events:
   - Backend inserts conversion status into a `conversions` table.
   - Frontend subscribes to changes using `supabase.channel('conversions').on('INSERT', callback)`.

---

### 3.5 User Accounts — History & Settings Persistence (MEDIUM PRIORITY)

> **Current State**: Auth works, but conversion history is local (filesystem/localStorage). No per-user data.

#### How to Implement

1. **Create Supabase table** `conversion_history`:
   ```sql
   CREATE TABLE conversion_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     source_filename TEXT,
     source_format TEXT,
     target_format TEXT,
     file_url TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```
2. **Backend** — On successful conversion, save record to this table (if user is authenticated).
3. **Frontend** — Fetch user-specific history from Supabase:
   ```javascript
   const { data } = await supabase
     .from('conversion_history')
     .select('*')
     .eq('user_id', session.user.id)
     .order('created_at', { ascending: false });
   ```
4. **"Frequently Used" settings** — Save user's last-used tool, preferred quality, etc. in Supabase `user_preferences` table.

---

### 3.6 OCR — Scanned PDF to Text (LOWER PRIORITY)

> **Current State**: Not implemented.

#### How to Implement

1. **Install system dependencies**: Tesseract OCR (`apt install tesseract-ocr` or Windows installer).
2. **Add pip packages**: `pytesseract` or `easyocr`.
3. **Create `backend/app/services/ocr_service.py`**:
   ```python
   import pytesseract
   from PIL import Image
   import fitz  # PyMuPDF

   async def ocr_pdf(file_bytes: bytes) -> str:
       doc = fitz.open(stream=file_bytes, filetype="pdf")
       full_text = ""
       for page in doc:
           pix = page.get_pixmap(dpi=300)
           img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
           full_text += pytesseract.image_to_string(img) + "\n"
       return full_text
   ```
4. **Create endpoint** `POST /api/convert/ocr` → returns extracted text as `.txt` or `.docx`.
5. **Frontend** — Add "Scan PDF (OCR)" tool card to the tools grid.

---

### 3.7 Privacy Mode — EXIF Metadata Scrubbing (LOWER PRIORITY)

> **Current State**: Not implemented.

#### How to Implement

1. **Add to `image_converter.py`**:
   ```python
   from PIL import Image
   from PIL.ExifTags import Base as ExifBase

   def strip_metadata(image: Image.Image) -> Image.Image:
       """Remove all EXIF/metadata from an image."""
       data = list(image.getdata())
       clean = Image.new(image.mode, image.size)
       clean.putdata(data)
       return clean
   ```
2. **Add optional param** `strip_metadata: bool = Form(False)` to the image convert endpoint.
3. **Frontend** — Add a "Privacy Mode" toggle in the file upload area or settings drawer.

---

### 3.8 Cloud Import/Export — Google Drive, Dropbox, OneDrive (LOWER PRIORITY)

> **Current State**: Not implemented.

#### How to Implement

1. **Google Drive**:
   - Use Google Picker API on frontend to let users select files.
   - On selection, get the file ID → call backend endpoint.
   - Backend uses Google Drive API (`google-api-python-client`) to download the file, convert, then optionally re-upload.
2. **Dropbox**:
   - Use Dropbox Chooser/Saver on frontend.
   - Backend uses `dropbox` Python SDK to fetch/upload.
3. **OneDrive**:
   - Use Microsoft Graph API + MSAL for auth.
   - Similar flow: pick → download → convert → save back.
4. **Create `backend/app/routers/cloud.py`** with endpoints:
   - `POST /api/cloud/import` (fetch file from cloud → convert).
   - `POST /api/cloud/export` (upload converted file to cloud).

---

### 3.9 Remote Fetch — URL-Based Conversion (LOWER PRIORITY)

> **Current State**: Not implemented.

#### How to Implement

1. **Create endpoint** `POST /api/convert/fetch`:
   ```python
   import httpx

   @router.post("/api/convert/fetch")
   async def fetch_and_convert(url: str = Form(...), target_format: str = Form(...)):
       async with httpx.AsyncClient() as client:
           response = await client.get(url)
       # Detect format from URL/content-type, run conversion, return result
   ```
2. **Security**: Validate URL (whitelist domains or restrict to known cloud URLs), set timeouts, limit download size.
3. **Frontend** — Add a "Paste URL" input alternative in the Smart Router section.

---

### 3.10 API Access — Developer API (LOWER PRIORITY)

> **Current State**: Not implemented.

#### How to Implement

1. **API Key system**: Generate API keys per user, store in Supabase `api_keys` table.
2. **Auth middleware**: Check `X-API-Key` header for API requests.
3. **Rate limiting**: Per-key rate limits (e.g., 100 requests/hour for free, 1000 for paid).
4. **API documentation**: FastAPI already generates Swagger UI at `/docs` — expose this as the developer portal.
5. **Frontend** — Add an "API Keys" section in the user Profile/Dashboard.

---

## Priority Summary

| Priority | Feature | Effort |
|----------|---------|--------|
| 🔴 **Critical Fix** | Duplicate code cleanup, missing route for Dashboard, file-size validation | 1-2 hours |
| 🔴 **Critical Fix** | Zero-Persistence (30-min auto-delete) | 3-4 hours |
| 🟠 **High** | Audio/Video conversion (FFmpeg) | 2-3 days |
| 🟠 **High** | Parallel Batch Processing | 1-2 days |
| 🟡 **Medium** | Format Tweak Menu (quality, resize, compress) | 2-3 days |
| 🟡 **Medium** | Supabase Storage + Realtime | 1-2 days |
| 🟡 **Medium** | User History in Supabase (per-user) | 1 day |
| 🟢 **Lower** | OCR (Tesseract) | 1-2 days |
| 🟢 **Lower** | Privacy Mode (EXIF strip) | 2-3 hours |
| 🟢 **Lower** | Cloud Import/Export | 3-5 days |
| 🟢 **Lower** | Remote Fetch (URL) | 1 day |
| 🟢 **Lower** | Developer API Access | 2-3 days |

---

## Current File Structure

```
Xvert/
├── frontend/               # React (Vite)
│   ├── src/
│   │   ├── pages/          # Home, Login, Signup, ForgotPassword, UpdatePassword, Profile, History, About, Dashboard
│   │   ├── components/     # Navbar, MegaMenu, Footer(s), ThemeContext, ToastContext, UserAvatar, ToolIcon, etc.
│   │   ├── services/       # AuthService, ConversionService, HistoryService, supabase.js
│   │   └── styles/         # CSS design system
│   └── public/             # Static assets, illustrations
│
├── backend/                # Python FastAPI
│   └── app/
│       ├── main.py         # App entry + CORS + router registration
│       ├── config.py       # Settings (Supabase, file limits)
│       ├── routers/        # convert.py (image+data), documents.py (doc+merge), files.py, share.py (unused)
│       ├── services/       # image_converter, document_converter, data_converter, supabase_service
│       └── utils/          # file_utils (naming, sanitization, history)
│
├── docs/                   # API docs, setup walkthrough, git workflow
└── start_app.ps1           # Startup script
```
