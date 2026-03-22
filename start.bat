@echo off
echo Starting Xvert Frontend and Backend...

start "Xvert Frontend" cmd /k "cd frontend && npm run dev"
start "Xvert Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload"

echo Both servers are starting in new windows.
