# VS Code One-Click Launch Design

**Date:** 2026-07-17  
**Status:** Proposed

## Goal

Provide a VS Code-native, repeatable development launch flow for manboard: pressing **F5** starts the FastAPI backend and Vite frontend, then opens the dashboard in the browser.

## Scope

Add version-controlled workspace settings:

- `.vscode/tasks.json` — persistent tasks for the API and dashboard dev server.
- `.vscode/launch.json` — launch configurations for each service and one compound `启动 Manboard（前后端）` configuration.

This configuration does not install dependencies or create virtual environments automatically. First-time setup remains explicit and follows the README.

## Runtime Contracts

### Backend task

- Runs from `${workspaceFolder}/core`.
- Uses `${workspaceFolder}/core/.venv/bin/python` to ensure VS Code uses the project virtual environment rather than an arbitrary system Python.
- Starts `uvicorn app.main:app --reload --port 8000`.
- Sets `MANBOARD_DATA_FILE` to `${workspaceFolder}/data/threads.json`.
- Marks the task ready when Uvicorn reports it is running.

### Frontend task

- Runs from `${workspaceFolder}/dashboard`.
- Runs `npm run dev -- --host localhost` on port 5173.
- Marks the task ready when Vite prints its localhost URL.

### Compound launch

- F5 configuration name: `启动 Manboard（前后端）`.
- Starts the API and dashboard configurations concurrently.
- Opens `http://localhost:5173` once the dashboard configuration reaches its readiness pattern.
- Individual backend and frontend launch configurations remain available for isolated debugging.

## First-Time Setup

Before F5 can work on a new checkout, the developer runs:

```bash
cd core
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd ../dashboard
npm install
```

If the Python virtual environment or Node modules are absent, VS Code exposes the command failure rather than silently modifying the local environment.

## Non-Goals

- Docker, deployment, or production startup.
- Replacing the existing README startup instructions.
- Modifying application source, ports, CORS, or data schema.
- Reusing `.claude/launch.json`, which targets obsolete Windows paths and is not a VS Code configuration.

## Verification

1. On an initialized checkout, select `启动 Manboard（前后端）` in VS Code's **Run and Debug** sidebar and press F5.
2. Confirm both task terminals remain active without startup errors.
3. Confirm the browser opens `http://localhost:5173` and the dashboard loads.
4. Confirm `http://localhost:8000/health` returns `{ "status": "ok" }`.
5. Stop the compound configuration and confirm both persistent processes terminate.
