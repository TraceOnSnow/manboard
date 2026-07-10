# manboard

Personal AI OS frontend shell — a unified hub for goals, projects, todos, research, media, and workflow shortcuts.

**The framework is open source. Your data is not.** Everything in `data/` is gitignored by default.

## Structure

```
manboard/
├── core/          # FastAPI backend — data model, storage, connectors
├── dashboard/     # Vite + React frontend
└── data/          # Private data (gitignored). data/sample/ is public.
```

## Quick start

### On a machine that already has the project set up

**Backend**
```bash
cd core
source .venv/bin/activate          # if you use a venv
MANBOARD_DATA_FILE=../data/threads.json uvicorn app.main:app --reload
```

**Frontend** (new terminal)
```bash
cd dashboard
npm run dev
```

Open http://localhost:5173.

### Fresh clone (new machine)

Assumes Python 3.10+, Node 18+, and git are installed.

```bash
git clone https://github.com/TraceOnSnow/manboard.git
cd manboard
```

**Backend**
```bash
cd core
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# data/threads.json is gitignored (private). Seed it from the sample:
cd ..
cp data/sample/threads.json data/threads.json
cd core

MANBOARD_DATA_FILE=../data/threads.json uvicorn app.main:app --reload
```

**Frontend** (new terminal)
```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173 (use `localhost`, not `127.0.0.1`).

### Common pitfalls

- **`pip: command not found` / can't import uvicorn** — you forgot to activate the venv. Run `source .venv/bin/activate` in every new shell before starting the backend.
- **Python too old** — needs 3.10+. Check with `python --version`; install a newer one with `mise`/`pyenv` if needed.
- **Port in use (8000 / 5173)** — keep the defaults; changing the backend port breaks the frontend, which hardcodes `http://localhost:8000` in `dashboard/src/api/threads.ts`.
- **CORS error** — access the app at `http://localhost:5173`, not `127.0.0.1`.
- **Empty data / "还没有 Thread"** — you skipped the seed step; run `cp data/sample/threads.json data/threads.json`.

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `MANBOARD_DATA_FILE` | `data/threads.json` | Path to the JSON data file |

## Data model

Every item is a **Thread** with these key fields:

- `type` — goal / project / research / todo / game / novel / anime / video / ai-chat / self-improvement / entry / other
- `horizon` — `today` / `week` / `long` / `none` (default)
- `priority` — now / next / later
- `status` — active / paused / parked / done

**Horizon routing** (view-exclusive):
- `horizon=today|week|long` → item appears only in the matching time section
- `horizon=none` → item appears in its type-based content section

## Sections (fixed order)

1. 今日目标 — horizon=today
2. 本周目标 — horizon=week
3. 长期目标 — horizon=long
4. 当前项目 — type=project, horizon=none
5. 待办 — type=todo, horizon=none
6. AI 对话摘要 — type=ai-chat, horizon=none
7. 研究方向 — type=research, horizon=none
8. 正在玩 / 看 — type ∈ {game, novel, anime, video}, horizon=none
9. 工作流入口 — type=entry, horizon=none (`notes` field stores URL/command)

## Backend tests

```bash
cd core
pytest tests/ -v
```

## Adding a new storage backend

Implement the `Storage` protocol in `core/app/storage.py` and point `get_storage()` at it:

```python
class MyStorage:
    def list(self) -> List[Thread]: ...
    def get(self, item_id: str) -> Thread: ...
    def create(self, payload: ThreadCreate) -> Thread: ...
    def update(self, item_id: str, payload: ThreadUpdate) -> Thread: ...
    def delete(self, item_id: str) -> bool: ...
```

## Planned connectors

The `Connector` protocol (`core/app/connectors.py`) defines the interface for future integrations: Obsidian, GitHub Issues, Calendar, RSS, AI archives. No connector is implemented in the current version.

## Continuing development

This project uses [Comet](https://docs.comet.rpamis.com/zh/introduction) (OpenSpec for WHAT + Superpowers for HOW) to drive changes through a recoverable, file-based workflow: `open → design → build → verify → archive`. Each change lives under `openspec/changes/<name>/`; finished ones are archived to `openspec/changes/archive/` and their specs merged into `openspec/specs/`.

### First-time setup (once per machine)

```bash
npm install -g @rpamis/comet
cd manboard
comet init        # installs Comet skills/hooks/rules for this project
comet doctor      # confirm the environment is healthy (all green)
```

### Starting a change

Work inside an AI agent that has Comet loaded (e.g. Claude Code). Describe what you want — Comet routes it:

- **New feature / refactor / anything with design weight** → `/comet <description>` starts a `full` change (open → design → build → verify → archive).
- **Small fix** → `/comet-hotfix <description>` (skips design).
- **Light-to-medium edit driven by a single OpenSpec change** → `/comet-tweak <description>`.

### Resuming after a break

State is stored in `.comet.yaml`, not in the conversation — so context survives across sessions, machines, and model switches. To pick up where you left off:

```bash
comet status      # see the active change and current phase
```

Then in the agent:

```
/comet 继续
```

Comet re-reads the state and resumes from the exact phase/step. No need to re-explain the history.

### Where things live

| Path | Purpose |
|------|---------|
| `openspec/changes/<name>/` | Active change artifacts (proposal, design, tasks, delta specs) |
| `openspec/changes/archive/` | Completed changes |
| `openspec/specs/` | Merged main specs (the accumulated source of truth) |
| `docs/superpowers/specs/` | Technical design docs |
| `docs/superpowers/plans/` | Implementation plans |
| `docs/superpowers/reports/` | Verification reports |

### Notes

- **Framework is open source, data is not.** `data/*.json` is gitignored; only `data/sample/` ships in the repo.
- The Comet phase-guard enforces workflow discipline automatically — if you try to edit source code while a change is mid-flight, it blocks and redirects you to the right phase. You don't have to police the process yourself.
