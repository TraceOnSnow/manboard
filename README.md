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

**Backend**
```bash
cd core
pip install -r requirements.txt
MANBOARD_DATA_FILE=../data/threads.json uvicorn app.main:app --reload
```

**Frontend** (new terminal)
```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173.

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
