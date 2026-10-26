@echo off
echo ======================================================================
echo Multimodal Construction Intelligence Platform - Local Dev Launcher
echo ======================================================================

cd /d "%~dp0"

echo [1/2] Starting Backend FastAPI on http://127.0.0.1:8000 ...
start "Construction Backend (FastAPI)" cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Vite on http://127.0.0.1:5173 ...
start "Construction Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers initiated!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Frontend Web App: http://127.0.0.1:5173
echo ======================================================================
pause
