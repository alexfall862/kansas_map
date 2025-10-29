# Kansas Counties Contact Map

A simple map app to mark which Kansas counties have a contact.

- **Frontend**: React (Vite)
- **Backend**: FastAPI (Python)
- **Storage**: JSON file (`backend/data/contacts.json`)
- **Deploy**: Railway (monorepo with two services)

## Quick Start (Local)

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm i
npm run dev -- --port 5173
```

The frontend expects the backend at `http://localhost:8000` during dev (see `frontend/src/api.js`).

### Add the SVG
Place your `kansas-counties.svg` here:
```
frontend/public/kansas-counties.svg
```
The `<path>` for each county must have an `id` equal to the county name without "County" (e.g., `id="Riley"`).

### CSV Format
`county,name,phone,email` (header required). `county` should match the SVG id (no "County").

## Railway Deployment

This repo is set up for Railway with a monorepo layout:
- Service 1: **backend** (FastAPI)
- Service 2: **frontend** (static build)

### Steps
1. Push this repo to GitHub.
2. In Railway, create a New Project → **Deploy from GitHub** → select this repo.
3. Add two services:
   - **Backend**: Root = `backend/`. Railway will use `requirements.txt` and run `uvicorn main:app --host 0.0.0.0 --port $PORT`.
   - **Frontend**: Root = `frontend/`. Build = `npm ci && npm run build`. Start = `npm run preview -- --host --port $PORT`.
4. Set `VITE_API_BASE` on the **frontend** service's variables to the **backend** public URL (e.g., `https://your-backend.up.railway.app`).

> The `railway.toml` provides sensible defaults; you can also configure via Railway UI.

## Exporting an Image
Use the **Export PNG** button in the UI to save the current map view as a PNG (client-side; no backend needed).
