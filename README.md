# PipelineX — CI/CD pipeline manager (prototype)

This repository contains a local, non-Docker prototype of a CI/CD pipeline manager (backend in Flask; frontend in React + Tailwind). It includes example APIs, a threaded build runner that executes shell commands, and a frontend that streams live logs via Socket.IO.

Project layout:
- backend/: Flask app, models, routes, Socket.IO server
- frontend/: React + Vite + Tailwind UI (dark neon/glow theme). The API connection is intentionally left empty in `.env` for you to wire to your backend.

Important notes:
- This is a developer prototype demonstrating the architecture. Do not use in production without hardening, proper authentication, and secret/config management.
- The UI intentionally does NOT include sign-in/sign-up pages because you indicated those will be integrated from the main app; the backend includes minimal `/api/auth` endpoints for integration and testing.

Run backend (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Run frontend (PowerShell):

```powershell
cd frontend
npm install
npm run dev
```

After starting both, update `frontend/.env` REACT_APP_API_URL to `http://localhost:5000` (or your backend host) and reload the frontend.
