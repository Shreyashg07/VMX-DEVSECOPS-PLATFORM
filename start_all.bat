@echo off
echo 🚀 Starting all services...

start cmd /k "cd backend && .\.venv\Scripts\activate && python app.py"
start cmd /k "cd frontendx && npm run dev"
start cmd /k "cd frontend && npm run dev"
start cmd /k "cd backendx && npm start"

echo ✅ All services started!
