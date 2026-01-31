# FileForge Project Setup Walkthrough

A complete explanation of every command and step used to set up this full-stack project.

---

## 📁 Project Structure Overview

```
Xvert/
├── frontend/          # React + Vite application
├── backend/           # Python FastAPI server
├── docs/              # Documentation
├── .gitignore         # Files to exclude from Git
└── implementation_plan.md
```

---

## 1. Frontend Setup (React + Vite)

### Command: Initialize React App
```bash
npx -y create-vite@latest frontend --template react
```

**Explanation:**
| Part | Meaning |
|------|---------|
| `npx` | Node Package eXecutor - runs npm packages without installing globally |
| `-y` | Auto-accept prompts (yes to all) |
| `create-vite@latest` | Uses the latest version of Vite's project creator |
| `frontend` | Creates a folder named "frontend" |
| `--template react` | Uses the React template (not TypeScript) |

**What it creates:**
```
frontend/
├── public/           # Static assets
├── src/
│   ├── App.jsx       # Main React component
│   ├── main.jsx      # Entry point (renders App)
│   ├── App.css       # Component styles
│   └── index.css     # Global styles
├── index.html        # HTML template
├── package.json      # Dependencies & scripts
└── vite.config.js    # Vite configuration
```

---

### Command: Install Frontend Dependencies
```bash
cd frontend
npm install @supabase/supabase-js react-router-dom react-dropzone axios
```

**Explanation:**
| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client for auth, database, storage |
| `react-router-dom` | Page navigation/routing in React |
| `react-dropzone` | Drag-and-drop file upload component |
| `axios` | HTTP client for API calls to backend |

**Where dependencies go:**
- Added to `package.json` under "dependencies"
- Downloaded to `node_modules/` folder

---

### File: Frontend Environment Variables
```bash
# frontend/.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

**Explanation:**
| Variable | Purpose |
|----------|---------|
| `VITE_` prefix | Required! Vite only exposes env vars starting with VITE_ |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public API key (safe for frontend) |
| `API_URL` | Backend server address |

**How to access in code:**
```javascript
const url = import.meta.env.VITE_SUPABASE_URL;
```

---

### File: Supabase Client Setup
```javascript
// frontend/src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Explanation:**
- `createClient()` initializes connection to Supabase
- Export makes it importable in other files: `import { supabase } from './services/supabase'`

---

### Command: Run Frontend Dev Server
```bash
npm run dev
```

**Explanation:**
- Runs the "dev" script from `package.json`
- Starts Vite development server on `http://localhost:5173`
- **Hot reload**: Changes update instantly without refresh

---

## 2. Backend Setup (Python + FastAPI)

### Command: Create Directory Structure
```bash
mkdir backend\app\routers, backend\app\services, backend\app\models, backend\app\utils
```

**Explanation:**
| Folder | Purpose |
|--------|---------|
| `app/` | Main application package |
| `routers/` | API endpoint definitions (like controllers) |
| `services/` | Business logic (conversion, email, etc.) |
| `models/` | Pydantic schemas for data validation |
| `utils/` | Helper functions |

---

### Command: Create Virtual Environment
```bash
cd backend
python -m venv venv
```

**Explanation:**
| Part | Meaning |
|------|---------|
| `python -m venv` | Run Python's venv module |
| `venv` | Name of the virtual environment folder |

**Why virtual environments?**
- Isolates project dependencies from system Python
- Each project can have different package versions
- Prevents conflicts between projects

**Folder created:**
```
backend/venv/
├── Scripts/        # Windows executables (activate, pip, python)
├── Lib/            # Installed packages go here
└── pyvenv.cfg      # Configuration
```

---

### Command: Activate Virtual Environment
```bash
# Windows PowerShell
.\venv\Scripts\activate

# Windows CMD
venv\Scripts\activate.bat

# Mac/Linux
source venv/bin/activate
```

**Explanation:**
- Modifies PATH so `python` and `pip` use the venv versions
- Terminal prompt shows `(venv)` when active
- **Must activate before installing packages!**

---

### File: requirements.txt
```
fastapi>=0.109.0
uvicorn>=0.27.0
python-multipart>=0.0.6
pillow>=10.0.0
python-docx>=1.1.0
markdown>=3.5.1
pandas>=2.1.4
openpyxl>=3.1.2
supabase>=2.3.0
resend>=0.7.0
python-dotenv>=1.0.0
```

**Explanation:**
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for building APIs |
| `uvicorn` | ASGI server to run FastAPI |
| `python-multipart` | Handle file uploads |
| `pillow` | Image processing/conversion |
| `python-docx` | Work with Word documents |
| `markdown` | Convert Markdown to HTML |
| `pandas` | Data manipulation (CSV, JSON, Excel) |
| `openpyxl` | Read/write Excel files |
| `supabase` | Supabase Python client |
| `resend` | Email service API |
| `python-dotenv` | Load .env files |

**Version syntax:**
- `>=0.109.0` means "version 0.109.0 or higher"
- `==0.109.0` would mean "exactly this version"

---

### Command: Install Python Dependencies
```bash
pip install -r requirements.txt
```

**Explanation:**
- `-r requirements.txt` reads list from file
- Downloads and installs all packages
- Packages stored in `venv/Lib/site-packages/`

---

### File: FastAPI Main Entry Point
```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()  # Load .env file

app = FastAPI(
    title="FileForge API",
    description="File conversion service API",
    version="1.0.0"
)

# CORS - Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to FileForge API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Key Concepts:**
| Concept | Explanation |
|---------|-------------|
| `FastAPI()` | Creates the application instance |
| `@app.get("/")` | Decorator - maps URL "/" to this function |
| `async def` | Asynchronous function (better performance) |
| `CORS` | Cross-Origin Resource Sharing - allows frontend (port 5173) to call backend (port 8000) |

---

### File: Configuration
```python
# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    # ... more settings
```

**Explanation:**
- `load_dotenv()` loads variables from `.env` file
- `os.getenv("NAME", "default")` gets env var or default value
- Class groups all settings together

---

### File: __init__.py Files
```python
# backend/app/__init__.py
# (can be empty or have minimal content)
```

**Explanation:**
- Makes Python treat the folder as a **package**
- Required for imports like `from app.services import converter`
- Can be empty in Python 3.3+, but good practice to include

---

### Command: Run Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

**Explanation:**
| Part | Meaning |
|------|---------|
| `uvicorn` | ASGI server program |
| `app.main` | Python path: `app/main.py` file |
| `:app` | The FastAPI instance variable name |
| `--reload` | Auto-restart on code changes (dev only!) |
| `--port 8000` | Listen on port 8000 |

**Result:** API running at `http://localhost:8000`

---

## 3. Testing the Setup

### Test Backend API
```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000" -Method Get
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get

# Alternative: curl (if installed)
curl http://localhost:8000
curl http://localhost:8000/health
```

**Expected responses:**
```json
{"message": "Welcome to FileForge API", "status": "running"}
{"status": "healthy"}
```

### Auto-Generated API Docs
FastAPI automatically creates documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 4. Environment Files Summary

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG...  # Service role key (secret!)
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:5173
```

**Important:**
- `.env` files contain secrets - **NEVER commit to Git!**
- `.gitignore` excludes them automatically
- Create `.env.example` with placeholder values for teammates

---

## 5. Quick Start Commands

```bash
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
