@echo off
echo Starting AI Document Screening Platform...

:: Start Backend in a new window
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "DocShield Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: Start Frontend in a new window
echo Starting Frontend (Vite on http://127.0.0.1:5173)...
start "DocShield Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both services launched!
echo - Frontend: http://127.0.0.1:5173
echo - Backend API Docs: http://127.0.0.1:8000/docs

