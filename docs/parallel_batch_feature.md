# Parallel Batch Conversion — Implementation Summary

**Feature**: Upload up to 20 files at once; FastAPI processes them in parallel while React shows 20 individual real-time progress bars.

**Date**: 2026-03-21  
**Status**: ✅ Implemented

---

## What Changed

### Backend — 3 new files, 1 modified

| File | Type | Purpose |
|---|---|---|
| `backend/app/services/batch_converter.py` | NEW | Orchestrates parallel conversion via `asyncio.gather()` |
| `backend/app/services/batch_converter_compat.py` | NEW | `BytesUploadFile` shim so batch jobs can reuse `document_converter` |
| `backend/app/routers/batch.py` | NEW | Three HTTP endpoints (see below) |
| `backend/app/main.py` | MODIFIED | Registered batch router at `/api/batch` |

#### API Endpoints

```
POST   /api/batch/convert                   → Upload ≤20 files, returns batch_id instantly
GET    /api/batch/progress/{batch_id}       → SSE stream: one event per file + batch_complete
GET    /api/batch/download/{file_id}/{name} → Download a converted temp file
```

#### How Parallelism Works

```
POST /api/batch/convert
  ├── Read all file bytes into memory
  ├── Create asyncio.Queue (progress events) + register batch_id
  └── asyncio.create_task(run_batch(...))   ← fire-and-forget, returns immediately

run_batch()
  └── asyncio.gather(
        convert_one(file_1, queue),   ← starts immediately
        convert_one(file_2, queue),   ← starts immediately
        ...up to 20 tasks simultaneously
      )

convert_one(file, queue)
  ├── queue.put({ status: "processing" })
  ├── asyncio.to_thread(convert_image/convert_data/convert_document)
  │     └── runs in ThreadPoolExecutor (CPU work, won't block event loop)
  └── queue.put({ status: "done", download_url: "..." })
```

**Format routing** (auto-detected from source extension):
- **Image → Image**: Pillow (`image_converter.py`)
- **Data → Data**: Pandas (`data_converter.py`)  
- **Document / PDF**: pdf2docx / docx2pdf / PyMuPDF (`document_converter.py`)

All existing individual converters are **unchanged and still work** — the batch system calls them internally.

---

### Frontend — 3 new files, 2 modified

| File | Type | Purpose |
|---|---|---|
| `frontend/src/hooks/useBatchUpload.js` | NEW | React hook: POST → SSE consumer → per-file state |
| `frontend/src/components/BatchUploader.jsx` | NEW | Dropzone + status banners + 20-card grid |
| `frontend/src/components/ProgressCard.jsx` | NEW | Animated progress bar for one file |
| `frontend/src/pages/Dashboard.jsx` | MODIFIED | Replaced old single-file view with `<BatchUploader>` |
| `frontend/src/styles/index.css` | MODIFIED | Added ~160 lines of batch/progress card CSS |

#### React Data Flow

```
User drops files
      ↓
BatchUploader.onDrop()
      ↓
useBatchUpload.startBatch(files, targetFormat)
      ├── POST /api/batch/convert (FormData with all files)
      │     → { batch_id, file_ids, filenames }
      ├── Pre-populate fileStates Map (all 20 cards appear instantly as "queued")
      └── new EventSource(/api/batch/progress/{batch_id})
              ↓ SSE message per file
            setFileStates({ [file_id]: { progress, status, downloadUrl } })
              ↓ "batch_complete" event
            setBatchStatus("done"), close EventSource
              ↓
Dashboard re-renders 20 ProgressCards independently
```

#### Key Design Decisions

- **No extra npm packages**: `EventSource` is a native browser API; `react-dropzone` was already in `package.json`.
- **Auth forwarded**: Supabase JWT is included in the upload `POST` header; the backend's optional auth (`get_optional_user`) picks it up.
- **1 file works too**: Sending 1 file shows 1 progress card — no separate single-file flow needed.
- **Backward compatible**: Old individual endpoints (`/api/convert/image`, `/api/convert/data`, `/api/convert/document`) are still registered and untouched for any direct API usage.

---

## File Reference

```
backend/app/
├── main.py                          ← +2 lines: batch router registered
├── routers/
│   └── batch.py                     ← NEW (113 lines)
└── services/
    ├── batch_converter.py           ← NEW (170 lines)
    └── batch_converter_compat.py    ← NEW (22 lines)

frontend/src/
├── pages/Dashboard.jsx              ← replaced 200-line tool view → 4-line BatchUploader mount
├── styles/index.css                 ← +160 lines batch/progress CSS
├── hooks/
│   └── useBatchUpload.js            ← NEW (145 lines)
└── components/
    ├── BatchUploader.jsx            ← NEW (115 lines)
    └── ProgressCard.jsx             ← NEW (68 lines)
```

---

## How to Run & Test

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend  
cd frontend
npm run dev
```

Then open `http://localhost:5173`, select any tool (e.g. **JPG to PNG**), and drop up to 20 files. Each file gets its own progress card that updates independently in real time.

### Quick API smoke-test (curl)

```bash
# Upload 3 files
curl -X POST http://localhost:8000/api/batch/convert \
  -F "files=@./Test_assest/(jpeg).jpg" \
  -F "files=@./Test_assest/(png).png" \
  -F "files=@./Test_assest/(gif).gif" \
  -F "target_format=png"

# Should return: { "batch_id": "...", "total": 3, "file_ids": [...] }

# Watch SSE stream in browser: http://localhost:8000/api/batch/progress/<batch_id>
```

---

## No Dependency Changes Required

All libraries needed were already in `requirements.txt`:
- `Pillow` — image conversion
- `pandas` / `openpyxl` — data conversion  
- `pdf2docx` / `pypdf` / `fitz` — document conversion
- `python-multipart` — file upload parsing
- `fastapi` — `StreamingResponse` for SSE
