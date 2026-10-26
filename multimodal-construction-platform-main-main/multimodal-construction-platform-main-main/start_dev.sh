#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "Multimodal Construction Intelligence Platform - Local Dev Launcher"
echo "======================================================================"

# Start backend
echo "[1/2] Starting Backend FastAPI on http://127.0.0.1:8000 ..."
(cd backend && source .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

# Start frontend
echo "[2/2] Starting Frontend Vite on http://127.0.0.1:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo "Both servers active!"
echo "Backend API Docs: http://127.0.0.1:8000/docs"
echo "Frontend Web App: http://127.0.0.1:5173"
echo "======================================================================"

wait
