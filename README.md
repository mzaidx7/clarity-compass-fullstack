# ClarityCompass – Local Dev (Mock API)

This repo contains a Next.js app for a student burnout tracker. The original plan used Firebase Auth and a separate backend service; due to billing/API issues, this setup is configured to run locally using a mock API and a simple "dev login" flow.

What’s included now:
- Full FastAPI backend under `backend/` with health, status, predict, fused, forecast, and survey save routes
- Frontend wired to backend by default (dev login issues HS256 token)
- Firebase removed from the frontend; Google sign-in disabled for local simplicity
- Calendar and Progress pages implemented with local storage

Quick start
- Requirements: Node 18+ and npm, Python 3.12+ for backend
- Frontend
  - Install: `npm install`
  - Run dev: `npm run dev` (defaults to port 9003)
  - Build: `npm run build` (Windows-compatible)
- Backend (FastAPI)
  - `cd backend`
  - Create venv: `python -m venv .venv` then activate (`.venv\Scripts\Activate.ps1` on Windows)
  - Install: `pip install -r requirements.txt`
  - Set env: `set AUTH_MODE=dev` and optionally `set ALLOWED_ORIGINS=http://localhost:9003`
  - Start: `uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload`

One-command start (Windows)
- From repo root run: `npm run dev:full`
- This opens two PowerShell windows:
  - Backend at `http://127.0.0.1:8000`
  - Frontend at `http://localhost:9003`
- To use the mock API instead, run: `powershell -ExecutionPolicy Bypass -File ./start-dev.ps1 -Mock`

How to sign in locally
- Visit `/login`
- Enter any user ID (e.g. `test-user`) and submit
- You’ll be redirected to `/dashboard`; API calls include your Bearer token

Environment
- `.env` defaults to the local backend: `NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
- `.env.production` can point to a deployed backend

Notes
- You can switch to the mock API by setting `NEXT_PUBLIC_USE_MOCK_API=true` (no backend required).
- Calendar stores events per-user in localStorage; Progress plots your saved Quick Risk scores from this device.
