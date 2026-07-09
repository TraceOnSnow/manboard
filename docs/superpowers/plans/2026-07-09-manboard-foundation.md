# manboard-foundation 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 manboard 从 `life-dashboard/` 单层应用重构为 `core/dashboard/data` 三层架构，演进数据模型（加 horizon/entry），交付覆盖 9 个分区的可体验 MVP 面板。

**Architecture:** 后端（core）用 FastAPI + Pydantic，抽出 `Storage` Protocol + `JsonStorage` 实现 + `get_storage()` 工厂，routes 用 `Depends` 注入；前端（dashboard）用 Vite + React + TS + Tailwind，App.tsx 从单列表改为 9 分区视图，分区逻辑由 `horizon`（时间区）和 `type`（内容区）组合推导，视图排他。

**Tech Stack:** Python 3.10+, FastAPI, Pydantic v2, pytest / Node 18+, Vite, React 18, TypeScript, Tailwind v3

## Global Constraints

- 不引入新运行时依赖（Python 侧仍 fastapi/uvicorn/pydantic；前端仍 react/vite/tailwind）
- 后端启动命令从 `core/` 目录执行；前端从 `dashboard/` 目录执行
- 数据文件路径由环境变量 `MANBOARD_DATA_FILE` 控制，默认 `data/threads.json`
- `data/` 真实数据 gitignore；仓库保留 `data/sample/threads.json` 和 `data/.gitkeep`
- 视图排他规则：标了 `horizon`（today/week/long）的条目只进时间区，`horizon=none` 的条目按 `type` 进内容区
- 分区内按 priority 排序：now=0 → next=1 → later=2
- 重构前必须打 git tag `pre-foundation` 作回滚点

---

## 文件结构

### 新建
- `core/` ← `life-dashboard/backend/` 内容迁移
- `core/app/storage.py` ← 重构为 Protocol + JsonStorage（含懒迁移）
- `core/app/connectors.py` ← 新建 Connector Protocol 契约
- `core/tests/` ← pytest 测试目录
- `core/tests/__init__.py`
- `core/tests/test_storage.py`
- `core/tests/test_api.py`
- `dashboard/` ← `life-dashboard/frontend/` 内容迁移
- `data/.gitkeep`
- `data/sample/threads.json`

### 修改
- `core/app/models.py` ← 加 Horizon 枚举、entry type
- `core/app/routes.py` ← 用 Depends(get_storage) 注入
- `core/app/main.py` ← CORS 路径无需改，确认 CORS 允许 localhost:5173
- `dashboard/src/types/thread.ts` ← 加 ThreadHorizon、entry type、HORIZON_LABELS
- `dashboard/src/components/ThreadForm.tsx` ← 加 horizon 字段选择
- `dashboard/src/App.tsx` ← 改为 9 分区布局
- `.gitignore` ← 加 data/ 排除规则
- `README.md` ← 更新启动说明

---
## Task 1：目录重构 + git 回滚点

**Files:**
- 操作：`git tag pre-foundation`
- 移动：`life-dashboard/backend/` → `core/`
- 移动：`life-dashboard/frontend/` → `dashboard/`
- 移动：`life-dashboard/backend/data/threads.json` → `data/threads.json`
- 删除：空的 `life-dashboard/` 目录
- 新建：`data/.gitkeep`、`data/sample/threads.json`
- 修改：`.gitignore`

**Interfaces:**
- Produces: `core/` 和 `dashboard/` 目录结构，后续所有任务基于此路径

- [ ] **Step 1: 打回滚 tag**
```bash
git tag pre-foundation
git tag  # 确认 pre-foundation 出现
```

- [ ] **Step 2: 移动目录**
```bash
cp -r life-dashboard/backend core
cp -r life-dashboard/frontend dashboard
```

- [ ] **Step 3: 移动数据文件**
```bash
mkdir -p data
mv core/data/threads.json data/threads.json 2>/dev/null || true
touch data/.gitkeep
mkdir -p data/sample
```

- [ ] **Step 4: 创建样例数据**

创建 `data/sample/threads.json`：
```json
{
  "sample-001": {
    "id": "sample-001",
    "title": "示例：完成一本书",
    "type": "goal",
    "status": "active",
    "priority": "next",
    "horizon": "long",
    "area": null,
    "nextAction": "找到这本书",
    "notes": null,
    "lastTouched": "2026-01-01T00:00:00+00:00",
    "createdAt": "2026-01-01T00:00:00+00:00",
    "updatedAt": "2026-01-01T00:00:00+00:00"
  }
}
```

- [ ] **Step 5: 删除旧目录**
```bash
rm -rf life-dashboard/
```

- [ ] **Step 6: 更新 .gitignore**

在 `.gitignore` 末尾追加：
```
# 私有数据（框架可开源，数据不入库）
data/*.json
data/**/*.json
!data/sample/
!data/sample/**
!data/.gitkeep
```

- [ ] **Step 7: 确认结构**
```bash
ls core/ dashboard/ data/
# 期望：core/ 有 app/ requirements.txt；dashboard/ 有 src/ package.json；data/ 有 .gitkeep sample/
```

- [ ] **Step 8: 提交**
```bash
git add -A
git commit -m "refactor: flatten life-dashboard → core/dashboard/data three-layer structure"
```

---

## Task 2：core 数据模型（models.py + pytest 框架搭建）

**Files:**
- Modify: `core/app/models.py`
- Create: `core/tests/__init__.py`
- Create: `core/tests/test_models.py`

**Interfaces:**
- Produces:
  - `Horizon` 枚举：`"today" | "week" | "long" | "none"`（默认 `"none"`）
  - `ThreadType` 新增 `"entry"`
  - `ThreadBase.horizon: Horizon = Horizon.none`
  - `ThreadUpdate.horizon: Optional[Horizon] = None`

- [ ] **Step 1: 安装 pytest（若未安装）**
```bash
cd core
pip install pytest httpx 2>/dev/null || true
# 或确认 requirements.txt 中有 pytest
grep -q pytest requirements.txt || echo "pytest\nhttpx" >> requirements.txt
```

- [ ] **Step 2: 创建测试目录**
```bash
mkdir -p core/tests
touch core/tests/__init__.py
```

- [ ] **Step 3: 写失败测试**

创建 `core/tests/test_models.py`：
```python
import pytest
from pydantic import ValidationError
from app.models import Thread, ThreadCreate, ThreadUpdate, Horizon, ThreadType


def test_horizon_default_is_none():
    t = ThreadCreate(title="x", type="todo")
    assert t.horizon == Horizon.none


def test_horizon_valid_values():
    for h in ("today", "week", "long", "none"):
        t = ThreadCreate(title="x", type="todo", horizon=h)
        assert t.horizon.value == h


def test_horizon_invalid_rejected():
    with pytest.raises(ValidationError):
        ThreadCreate(title="x", type="todo", horizon="someday")


def test_entry_type_valid():
    t = ThreadCreate(title="打开 Linear", type="entry")
    assert t.type == ThreadType.entry


def test_thread_update_horizon_optional():
    u = ThreadUpdate(horizon="today")
    assert u.horizon == Horizon.today
    u2 = ThreadUpdate()
    assert u2.horizon is None
```

- [ ] **Step 4: 运行测试确认失败**
```bash
cd core && python -m pytest tests/test_models.py -v 2>&1 | head -20
# 期望：FAILED / ImportError（Horizon 尚未定义）
```

- [ ] **Step 5: 修改 core/app/models.py**

在 `ThreadType` 枚举末尾加 `entry = "entry"`；在文件顶部加 `Horizon` 枚举；在 `ThreadBase` 和 `ThreadUpdate` 加 horizon 字段：

```python
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ThreadType(str, Enum):
    goal = "goal"
    project = "project"
    research = "research"
    todo = "todo"
    game = "game"
    novel = "novel"
    anime = "anime"
    video = "video"
    ai_chat = "ai-chat"
    self_improvement = "self-improvement"
    entry = "entry"          # 工作流入口（新增）
    other = "other"


class ThreadStatus(str, Enum):
    active = "active"
    paused = "paused"
    parked = "parked"
    done = "done"


class ThreadPriority(str, Enum):
    now = "now"
    next = "next"
    later = "later"


class Horizon(str, Enum):
    today = "today"
    week = "week"
    long = "long"
    none = "none"


class ThreadBase(BaseModel):
    title: str = Field(..., min_length=1)
    type: ThreadType
    status: ThreadStatus = ThreadStatus.active
    priority: ThreadPriority = ThreadPriority.next
    horizon: Horizon = Horizon.none          # 新增
    area: Optional[str] = None
    nextAction: Optional[str] = None
    notes: Optional[str] = None


class ThreadCreate(ThreadBase):
    pass


class ThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    type: Optional[ThreadType] = None
    status: Optional[ThreadStatus] = None
    priority: Optional[ThreadPriority] = None
    horizon: Optional[Horizon] = None       # 新增
    area: Optional[str] = None
    nextAction: Optional[str] = None
    notes: Optional[str] = None


class Thread(ThreadBase):
    id: str
    lastTouched: str
    createdAt: str
    updatedAt: str
```

- [ ] **Step 6: 运行测试确认通过**
```bash
cd core && python -m pytest tests/test_models.py -v
# 期望：5 passed
```

- [ ] **Step 7: 提交**
```bash
git add core/app/models.py core/tests/
git commit -m "feat(core): add Horizon enum and entry type to data model"
```

---

## Task 3：Storage 抽象（Protocol + JsonStorage + 懒迁移）

**Files:**
- Modify: `core/app/storage.py`
- Create: `core/tests/test_storage.py`

**Interfaces:**
- Consumes: `Thread`, `ThreadCreate`, `ThreadUpdate`, `Horizon` from `app.models`
- Produces:
  - `class Storage(Protocol)` with `list() / get(id) / create(payload) / update(id, payload) / delete(id)`
  - `class JsonStorage` 实现上述 Protocol
  - `def get_storage() -> Storage` 工厂，读 `MANBOARD_DATA_FILE` 环境变量

- [ ] **Step 1: 写失败测试**

创建 `core/tests/test_storage.py`：
```python
import json, os, tempfile, pytest
from app.models import ThreadCreate, Horizon
from app.storage import JsonStorage, get_storage


@pytest.fixture
def tmp_storage(tmp_path):
    f = tmp_path / "threads.json"
    return JsonStorage(str(f))


def test_create_and_list(tmp_storage):
    t = tmp_storage.create(ThreadCreate(title="buy milk", type="todo"))
    assert t.title == "buy milk"
    assert t.horizon == Horizon.none
    items = tmp_storage.list()
    assert len(items) == 1


def test_get(tmp_storage):
    t = tmp_storage.create(ThreadCreate(title="x", type="todo"))
    got = tmp_storage.get(t.id)
    assert got.id == t.id


def test_get_missing_raises(tmp_storage):
    with pytest.raises(KeyError):
        tmp_storage.get("nonexistent")


def test_update(tmp_storage):
    from app.models import ThreadUpdate
    t = tmp_storage.create(ThreadCreate(title="x", type="todo"))
    updated = tmp_storage.update(t.id, ThreadUpdate(title="y"))
    assert updated.title == "y"


def test_delete(tmp_storage):
    t = tmp_storage.create(ThreadCreate(title="x", type="todo"))
    assert tmp_storage.delete(t.id) is True
    assert tmp_storage.delete("nonexistent") is False


def test_lazy_migration_adds_horizon(tmp_path):
    """旧条目缺 horizon 字段，加载时应补 none。"""
    f = tmp_path / "threads.json"
    old = {"abc": {"id": "abc", "title": "old", "type": "todo",
                   "status": "active", "priority": "next",
                   "area": None, "nextAction": None, "notes": None,
                   "lastTouched": "2025-01-01T00:00:00+00:00",
                   "createdAt": "2025-01-01T00:00:00+00:00",
                   "updatedAt": "2025-01-01T00:00:00+00:00"}}
    f.write_text(json.dumps(old))
    s = JsonStorage(str(f))
    items = s.list()
    assert items[0].horizon == Horizon.none
    # 持久化
    s.update(items[0].id, __import__('app.models', fromlist=['ThreadUpdate']).ThreadUpdate(title="old"))
    data = json.loads(f.read_text())
    assert data["abc"]["horizon"] == "none"


def test_get_storage_env(tmp_path, monkeypatch):
    f = tmp_path / "t.json"
    monkeypatch.setenv("MANBOARD_DATA_FILE", str(f))
    s = get_storage()
    assert isinstance(s, JsonStorage)
```

- [ ] **Step 2: 运行确认失败**
```bash
cd core && python -m pytest tests/test_storage.py -v 2>&1 | head -20
# 期望：ImportError 或 FAILED
```

- [ ] **Step 3: 重构 core/app/storage.py**

```python
import json
import os
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List, Protocol, runtime_checkable

from .models import Thread, ThreadCreate, ThreadUpdate, Horizon


@runtime_checkable
class Storage(Protocol):
    def list(self) -> List[Thread]: ...
    def get(self, item_id: str) -> Thread: ...
    def create(self, payload: ThreadCreate) -> Thread: ...
    def update(self, item_id: str, payload: ThreadUpdate) -> Thread: ...
    def delete(self, item_id: str) -> bool: ...


class JsonStorage:
    def __init__(self, data_file: str):
        self._file = data_file
        self._lock = Lock()

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _load(self) -> Dict[str, dict]:
        if not os.path.exists(self._file):
            return {}
        try:
            with open(self._file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, OSError):
            return {}

    def _save(self, data: Dict[str, dict]) -> None:
        os.makedirs(os.path.dirname(os.path.abspath(self._file)), exist_ok=True)
        tmp = self._file + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self._file)

    def _migrate(self, record: dict) -> dict:
        """懒迁移：补全缺失字段。"""
        if "horizon" not in record or record["horizon"] is None:
            record["horizon"] = Horizon.none.value
        return record

    def list(self) -> List[Thread]:
        data = self._load()
        return [Thread(**self._migrate(v)) for v in data.values()]

    def get(self, item_id: str) -> Thread:
        data = self._load()
        if item_id not in data:
            raise KeyError(item_id)
        return Thread(**self._migrate(data[item_id]))

    def create(self, payload: ThreadCreate) -> Thread:
        with self._lock:
            data = self._load()
            now = self._now()
            item_id = uuid.uuid4().hex[:12]
            record = {
                "id": item_id,
                **payload.model_dump(mode="json"),
                "lastTouched": now,
                "createdAt": now,
                "updatedAt": now,
            }
            data[item_id] = record
            self._save(data)
            return Thread(**record)

    def update(self, item_id: str, payload: ThreadUpdate) -> Thread:
        with self._lock:
            data = self._load()
            if item_id not in data:
                raise KeyError(item_id)
            record = self._migrate(data[item_id])
            updates = payload.model_dump(exclude_unset=True, mode="json")
            record.update(updates)
            now = self._now()
            record["lastTouched"] = now
            record["updatedAt"] = now
            data[item_id] = record
            self._save(data)
            return Thread(**record)

    def delete(self, item_id: str) -> bool:
        with self._lock:
            data = self._load()
            if item_id not in data:
                return False
            del data[item_id]
            self._save(data)
            return True


def get_storage() -> Storage:
    path = os.getenv("MANBOARD_DATA_FILE", "data/threads.json")
    return JsonStorage(path)
```

- [ ] **Step 4: 运行测试确认通过**
```bash
cd core && python -m pytest tests/test_storage.py -v
# 期望：全部 PASS
```

- [ ] **Step 5: 提交**
```bash
git add core/app/storage.py core/tests/test_storage.py
git commit -m "feat(core): Storage Protocol + JsonStorage with lazy horizon migration"
```

---

## Task 4：Connector 契约 + routes 依赖注入

**Files:**
- Create: `core/app/connectors.py`
- Modify: `core/app/routes.py`
- Create: `core/tests/test_api.py`

**Interfaces:**
- Consumes: `Storage`, `get_storage` from `app.storage`; `Thread`, `ThreadCreate`, `ThreadUpdate` from `app.models`
- Produces:
  - `class Connector(Protocol)` with `fetch() -> list[Thread]`
  - `routes.py` 全部端点通过 `Depends(get_storage)` 注入

- [ ] **Step 1: 创建 core/app/connectors.py**
```python
from typing import List, Protocol
from .models import Thread


class Connector(Protocol):
    """外部数据源 → core 条目。本 change 仅定义契约，不含任何真实实现。"""
    def fetch(self) -> List[Thread]: ...
```

- [ ] **Step 2: 写 API 测试**

创建 `core/tests/test_api.py`：
```python
import json, pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage import JsonStorage


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("MANBOARD_DATA_FILE", str(tmp_path / "threads.json"))
    return TestClient(app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_create_and_list(client):
    r = client.post("/threads", json={"title": "buy milk", "type": "todo"})
    assert r.status_code == 201
    data = r.json()
    assert data["horizon"] == "none"

    r2 = client.get("/threads")
    assert r2.status_code == 200
    assert len(r2.json()) == 1


def test_horizon_field_roundtrip(client):
    r = client.post("/threads", json={"title": "今天跑步", "type": "todo", "horizon": "today"})
    assert r.status_code == 201
    assert r.json()["horizon"] == "today"


def test_invalid_horizon_rejected(client):
    r = client.post("/threads", json={"title": "x", "type": "todo", "horizon": "someday"})
    assert r.status_code == 422


def test_patch_horizon(client):
    r = client.post("/threads", json={"title": "x", "type": "todo"})
    tid = r.json()["id"]
    r2 = client.patch(f"/threads/{tid}", json={"horizon": "week"})
    assert r2.status_code == 200
    assert r2.json()["horizon"] == "week"


def test_delete(client):
    r = client.post("/threads", json={"title": "x", "type": "todo"})
    tid = r.json()["id"]
    r2 = client.delete(f"/threads/{tid}")
    assert r2.status_code == 204
```

- [ ] **Step 3: 运行确认失败**
```bash
cd core && python -m pytest tests/test_api.py -v 2>&1 | head -20
# 期望：部分失败（horizon 字段未传到 routes）
```

- [ ] **Step 4: 重构 core/app/routes.py**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from .models import ThreadCreate, ThreadUpdate, Thread
from .storage import Storage, get_storage

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("", response_model=list[Thread])
def list_threads(storage: Storage = Depends(get_storage)):
    return storage.list()


@router.post("", response_model=Thread, status_code=status.HTTP_201_CREATED)
def create_thread(payload: ThreadCreate, storage: Storage = Depends(get_storage)):
    return storage.create(payload)


@router.patch("/{thread_id}", response_model=Thread)
def update_thread(thread_id: str, payload: ThreadUpdate,
                  storage: Storage = Depends(get_storage)):
    try:
        return storage.update(thread_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Thread not found")


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(thread_id: str, storage: Storage = Depends(get_storage)):
    if not storage.delete(thread_id):
        raise HTTPException(status_code=404, detail="Thread not found")
```

- [ ] **Step 5: 运行全部测试确认通过**
```bash
cd core && python -m pytest tests/ -v
# 期望：全部 PASS
```

- [ ] **Step 6: 启动后端确认可用**
```bash
cd core && uvicorn app.main:app --reload --port 8000 &
sleep 2
curl -s http://localhost:8000/health | python3 -m json.tool
curl -s http://localhost:8000/docs | head -5
kill %1
```

- [ ] **Step 7: 提交**
```bash
git add core/app/connectors.py core/app/routes.py core/tests/test_api.py
git commit -m "feat(core): Connector Protocol + routes DI via Depends(get_storage)"
```

---

## Task 5：dashboard 类型与 ThreadForm（加 horizon）

**Files:**
- Modify: `dashboard/src/types/thread.ts`
- Modify: `dashboard/src/components/ThreadForm.tsx`

**Interfaces:**
- Produces:
  - `type ThreadHorizon = "today" | "week" | "long" | "none"`
  - `THREAD_HORIZONS: ThreadHorizon[]`
  - `HORIZON_LABELS: Record<ThreadHorizon, string>`
  - `Thread.horizon: ThreadHorizon`
  - `ThreadInput.horizon?: ThreadHorizon`
  - `ThreadForm` 渲染 horizon 下拉选择

- [ ] **Step 1: 修改 dashboard/src/types/thread.ts**

在文件中加入 horizon 相关类型，并在 `Thread`、`ThreadInput` 接口加 horizon 字段：

```typescript
// 在文件顶部加入（ThreadType 之后）
export type ThreadHorizon = "today" | "week" | "long" | "none";

// 修改 Thread 接口，加入 horizon
export interface Thread {
  id: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  priority: ThreadPriority;
  horizon: ThreadHorizon;   // 新增
  area?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  lastTouched: string;
  createdAt: string;
  updatedAt: string;
}

// 修改 ThreadInput 接口
export interface ThreadInput {
  title: string;
  type: ThreadType;
  status?: ThreadStatus;
  priority?: ThreadPriority;
  horizon?: ThreadHorizon;  // 新增
  area?: string;
  nextAction?: string;
  notes?: string;
}

// 在 THREAD_TYPES 后加入（同文件末尾常量区）
export const THREAD_TYPES: ThreadType[] = [
  "goal", "project", "research", "todo",
  "game", "novel", "anime", "video",
  "ai-chat", "self-improvement", "entry", "other",  // entry 新增
];

export const THREAD_HORIZONS: ThreadHorizon[] = ["today", "week", "long", "none"];

export const HORIZON_LABELS: Record<ThreadHorizon, string> = {
  today: "今日",
  week: "本周",
  long: "长期",
  none: "无",
};

// TYPE_LABELS 加入 entry
export const TYPE_LABELS: Record<ThreadType, string> = {
  goal: "长期目标",
  project: "项目",
  research: "研究",
  todo: "待办",
  game: "游戏",
  novel: "小说",
  anime: "番剧",
  video: "视频",
  "ai-chat": "AI 对话",
  "self-improvement": "自我提升",
  entry: "工作流入口",   // 新增
  other: "其他",
};
```

- [ ] **Step 2: 修改 ThreadForm，加入 horizon 选择**

在 `dashboard/src/components/ThreadForm.tsx` 中：

1. 在 import 里加入 `THREAD_HORIZONS, HORIZON_LABELS, type ThreadHorizon`
2. 在 `emptyInput` 加 `horizon: "none" as ThreadHorizon`
3. 在 `useEffect` 的 `initial` 分支加 `horizon: initial.horizon ?? "none"`
4. 在 type/status/priority 三列下拉之后，加一个 horizon 下拉：

```tsx
{/* 在 grid cols-3 的 priority 列之后，改为 grid-cols-4 并追加 horizon 列 */}
<div className="grid grid-cols-2 gap-2">
  {/* type / status / priority 保持原样，此处只展示新增的 horizon */}
  <div>
    <label className={labelClass}>时间轴</label>
    <select
      className={fieldClass}
      value={input.horizon ?? "none"}
      onChange={(e) => update("horizon", e.target.value as ThreadHorizon)}
    >
      {THREAD_HORIZONS.map((h) => (
        <option key={h} value={h}>
          {HORIZON_LABELS[h]}
        </option>
      ))}
    </select>
  </div>
</div>
```

实际修改时将 `grid-cols-3` 改为 `grid-cols-2 sm:grid-cols-4` 并在其中加第四列。

- [ ] **Step 3: 确认前端 TypeScript 编译通过**
```bash
cd dashboard && npm run build 2>&1 | tail -20
# 期望：无 TypeScript 错误
```

- [ ] **Step 4: 提交**
```bash
git add dashboard/src/types/thread.ts dashboard/src/components/ThreadForm.tsx
git commit -m "feat(dashboard): add ThreadHorizon type and horizon selector in ThreadForm"
```

---

---

## Task 4：Connector 契约 + API 适配（routes 注入）

**Files:**
- Create: `core/app/connectors.py`
- Modify: `core/app/routes.py`
- Create: `core/tests/test_api.py`

**Interfaces:**
- Consumes: `Storage` Protocol, `get_storage()` from `app.storage`
- Produces:
  - `class Connector(Protocol)` with `fetch() -> list[Thread]`
  - routes 全部通过 `Depends(get_storage)` 注入 storage

- [ ] **Step 1: 写 API 测试（失败测试）**

创建 `core/tests/test_api.py`：
```python
import json, os, tempfile, pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path):
    data_file = str(tmp_path / "threads.json")
    os.environ["MANBOARD_DATA_FILE"] = data_file
    from app.main import app
    import importlib, app.storage as st
    importlib.reload(st)         # 让 get_storage 重新读环境变量
    with TestClient(app) as c:
        yield c
    os.environ.pop("MANBOARD_DATA_FILE", None)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_create_and_list(client):
    r = client.post("/threads", json={"title": "test", "type": "todo"})
    assert r.status_code == 201
    data = r.json()
    assert data["horizon"] == "none"

    r2 = client.get("/threads")
    assert len(r2.json()) == 1


def test_create_with_horizon(client):
    r = client.post("/threads", json={"title": "morning run", "type": "todo", "horizon": "today"})
    assert r.status_code == 201
    assert r.json()["horizon"] == "today"


def test_invalid_horizon_rejected(client):
    r = client.post("/threads", json={"title": "x", "type": "todo", "horizon": "someday"})
    assert r.status_code == 422


def test_patch_horizon(client):
    r = client.post("/threads", json={"title": "x", "type": "todo"})
    tid = r.json()["id"]
    r2 = client.patch(f"/threads/{tid}", json={"horizon": "week"})
    assert r2.json()["horizon"] == "week"


def test_delete(client):
    r = client.post("/threads", json={"title": "x", "type": "todo"})
    tid = r.json()["id"]
    r2 = client.delete(f"/threads/{tid}")
    assert r2.status_code == 204
    assert client.get("/threads").json() == []
```

- [ ] **Step 2: 运行测试确认失败**
```bash
cd core && python -m pytest tests/test_api.py -v 2>&1 | head -20
# 期望：FAILED（routes 还没改成 Depends 注入）
```

- [ ] **Step 3: 创建 core/app/connectors.py**
```python
from typing import Protocol
from .models import Thread


class Connector(Protocol):
    """外部数据源 → core 条目接口契约。本 change 仅定义形状，不含任何实现。"""

    def fetch(self) -> list[Thread]:
        ...
```

- [ ] **Step 4: 重构 core/app/routes.py（Depends 注入）**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from .models import ThreadCreate, ThreadUpdate, Thread
from .storage import Storage, get_storage

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("", response_model=list[Thread])
def list_threads(storage: Storage = Depends(get_storage)):
    return storage.list()


@router.post("", response_model=Thread, status_code=status.HTTP_201_CREATED)
def create_thread(payload: ThreadCreate, storage: Storage = Depends(get_storage)):
    return storage.create(payload)


@router.patch("/{thread_id}", response_model=Thread)
def update_thread(
    thread_id: str, payload: ThreadUpdate, storage: Storage = Depends(get_storage)
):
    try:
        return storage.update(thread_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Thread not found")


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(thread_id: str, storage: Storage = Depends(get_storage)):
    if not storage.delete(thread_id):
        raise HTTPException(status_code=404, detail="Thread not found")
```

- [ ] **Step 5: 运行全部后端测试**
```bash
cd core && python -m pytest tests/ -v
# 期望：全部 PASS（test_models + test_storage + test_api）
```

- [ ] **Step 6: 确认服务可本地启动**
```bash
cd core && MANBOARD_DATA_FILE=../data/threads.json python -m uvicorn app.main:app --reload --port 8000 &
sleep 2 && curl -s http://localhost:8000/health
# 期望：{"status":"ok"}
kill %1 2>/dev/null || true
```

- [ ] **Step 7: 提交**
```bash
git add core/app/connectors.py core/app/routes.py core/tests/test_api.py
git commit -m "feat(core): add Connector contract, refactor routes to Depends injection"
```

---

## Task 5：dashboard 类型与 ThreadForm（加 horizon）

**Files:**
- Modify: `dashboard/src/types/thread.ts`
- Modify: `dashboard/src/components/ThreadForm.tsx`

**Interfaces:**
- Consumes: 后端 `horizon` 字段（`"today" | "week" | "long" | "none"`）
- Produces:
  - `ThreadHorizon` 类型
  - `Thread.horizon: ThreadHorizon`
  - `ThreadInput.horizon?: ThreadHorizon`
  - `HORIZON_LABELS: Record<ThreadHorizon, string>`
  - `ThreadForm` 新增 horizon 选择器

- [ ] **Step 1: 更新 dashboard/src/types/thread.ts**

在文件中加入 `ThreadHorizon`，并将其加到 `Thread`、`ThreadInput`：
```typescript
export type ThreadType =
  | "goal"
  | "project"
  | "research"
  | "todo"
  | "game"
  | "novel"
  | "anime"
  | "video"
  | "ai-chat"
  | "entry"             // 新增：工作流入口
  | "self-improvement"
  | "other";

export type ThreadStatus = "active" | "paused" | "parked" | "done";
export type ThreadPriority = "now" | "next" | "later";
export type ThreadHorizon = "today" | "week" | "long" | "none";  // 新增

export interface Thread {
  id: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  priority: ThreadPriority;
  horizon: ThreadHorizon;   // 新增
  area?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  lastTouched: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadInput {
  title: string;
  type: ThreadType;
  status?: ThreadStatus;
  priority?: ThreadPriority;
  horizon?: ThreadHorizon;   // 新增
  area?: string;
  nextAction?: string;
  notes?: string;
}

export type ThreadPatch = Partial<ThreadInput>;

export const THREAD_TYPES: ThreadType[] = [
  "goal", "project", "research", "todo",
  "game", "novel", "anime", "video",
  "ai-chat", "entry", "self-improvement", "other",
];

export const THREAD_HORIZONS: ThreadHorizon[] = ["today", "week", "long", "none"];  // 新增
export const THREAD_STATUSES: ThreadStatus[] = ["active", "paused", "parked", "done"];
export const THREAD_PRIORITIES: ThreadPriority[] = ["now", "next", "later"];

export const TYPE_LABELS: Record<ThreadType, string> = {
  goal: "长期目标",
  project: "项目",
  research: "研究",
  todo: "待办",
  game: "游戏",
  novel: "小说",
  anime: "番剧",
  video: "视频",
  "ai-chat": "AI 对话",
  entry: "工作流入口",           // 新增
  "self-improvement": "自我提升",
  other: "其他",
};

export const HORIZON_LABELS: Record<ThreadHorizon, string> = {  // 新增
  today: "今日",
  week: "本周",
  long: "长期",
  none: "无",
};

export const STATUS_LABELS: Record<ThreadStatus, string> = {
  active: "进行中",
  paused: "暂停",
  parked: "搁置",
  done: "完成",
};

export const PRIORITY_LABELS: Record<ThreadPriority, string> = {
  now: "现在",
  next: "下一步",
  later: "稍后",
};
```

- [ ] **Step 2: 更新 ThreadForm.tsx — 加 horizon 选择器**

在 `emptyInput` 中加 `horizon: "none"`；在表单的三列 grid 中加第四列（或单独一行），内容为 horizon 下拉：

在 `emptyInput` 对象里加：
```typescript
const emptyInput: ThreadInput = {
  title: "",
  type: "todo",
  status: "active",
  priority: "next",
  horizon: "none",   // 新增
  area: "",
  nextAction: "",
  notes: "",
};
```

在 `useEffect` 中补 horizon 映射：
```typescript
setInput({
  title: initial.title,
  type: initial.type,
  status: initial.status,
  priority: initial.priority,
  horizon: initial.horizon ?? "none",  // 新增
  area: initial.area ?? "",
  nextAction: initial.nextAction ?? "",
  notes: initial.notes ?? "",
});
```

在表单 grid 区域末尾追加 horizon 选择器（与 status/priority 同行或单独一行均可）：
```tsx
import {
  THREAD_TYPES, THREAD_STATUSES, THREAD_PRIORITIES, THREAD_HORIZONS,
  TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS, HORIZON_LABELS,
  type Thread, type ThreadInput,
} from "../types/thread";

// 在 grid 中加第四个 div：
<div>
  <label className={labelClass}>时间轴</label>
  <select
    className={fieldClass}
    value={input.horizon ?? "none"}
    onChange={(e) => update("horizon", e.target.value as ThreadInput["horizon"])}
  >
    {THREAD_HORIZONS.map((h) => (
      <option key={h} value={h}>
        {HORIZON_LABELS[h]}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Step 3: 确认 TypeScript 编译无报错**
```bash
cd dashboard && npm run build 2>&1 | tail -10
# 期望：无 error，只有可能的 warning
```

- [ ] **Step 4: 提交**
```bash
git add dashboard/src/types/thread.ts dashboard/src/components/ThreadForm.tsx
git commit -m "feat(dashboard): add ThreadHorizon type, entry type, horizon selector in form"
```

---

## Task 6：App.tsx — 9 分区布局

**Files:**
- Modify: `dashboard/src/App.tsx`

**Interfaces:**
- Consumes: `Thread`, `ThreadHorizon`, `HORIZON_LABELS`, `TYPE_LABELS` from `../types/thread`
- Produces: 9 分区布局；分区逻辑视图排他（horizon → 时间区，else type → 内容区）

- [ ] **Step 1: 写新的 App.tsx**

完整替换 `dashboard/src/App.tsx`：

```tsx
import { useEffect, useState } from "react";
import { api } from "./api/threads";
import { ThreadForm } from "./components/ThreadForm";
import { ThreadCard } from "./components/ThreadCard";
import {
  TYPE_LABELS,
  HORIZON_LABELS,
  type Thread,
  type ThreadInput,
  type ThreadStatus,
  type ThreadHorizon,
} from "./types/thread";

const priorityRank: Record<string, number> = { now: 0, next: 1, later: 2 };

function sortByPriority(items: Thread[]): Thread[] {
  return [...items].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

// 时间区：按 horizon 筛选，不限 type
function timeSection(threads: Thread[], horizon: ThreadHorizon): Thread[] {
  return sortByPriority(threads.filter((t) => t.horizon === horizon));
}

// 内容区：horizon=none 且 type 匹配
function typeSection(threads: Thread[], types: string[]): Thread[] {
  return sortByPriority(
    threads.filter((t) => t.horizon === "none" && types.includes(t.type))
  );
}

interface SectionProps {
  title: string;
  items: Thread[];
  defaultType: ThreadInput["type"];
  onAdd: (input: ThreadInput) => Promise<void>;
  onEdit: (t: Thread) => void;
  onDelete: (id: string) => void;
  onCycleStatus: (t: Thread, next: ThreadStatus) => void;
}

function Section({ title, items, defaultType, onAdd, onEdit, onDelete, onCycleStatus }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          + 新增
        </button>
      </div>

      {items.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-400">
          空
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((t) => (
          <ThreadCard
            key={t.id}
            thread={t}
            onEdit={() => onEdit(t)}
            onDelete={() => onDelete(t.id)}
            onCycleStatus={(next) => onCycleStatus(t, next)}
          />
        ))}
      </div>

      {showForm && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
          <ThreadForm
            initial={{ type: defaultType } as Thread}
            onSubmit={async (input) => {
              await onAdd(input);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Thread | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setThreads(await api.listThreads());
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (input: ThreadInput) => {
    await api.createThread(input);
    await load();
  };

  const handleUpdate = async (input: ThreadInput) => {
    if (!editing) return;
    await api.updateThread(editing.id, input);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除？")) return;
    await api.deleteThread(id);
    await load();
  };

  const handleCycleStatus = async (thread: Thread, next: ThreadStatus) => {
    await api.updateThread(thread.id, { status: next });
    await load();
  };

  const sections: Array<{
    title: string;
    items: Thread[];
    defaultType: ThreadInput["type"];
  }> = [
    { title: "今日目标", items: timeSection(threads, "today"), defaultType: "goal" },
    { title: "本周目标", items: timeSection(threads, "week"), defaultType: "goal" },
    { title: "长期目标", items: timeSection(threads, "long"), defaultType: "goal" },
    { title: "当前项目", items: typeSection(threads, ["project"]), defaultType: "project" },
    { title: "待办", items: typeSection(threads, ["todo"]), defaultType: "todo" },
    { title: "AI 对话摘要", items: typeSection(threads, ["ai-chat"]), defaultType: "ai-chat" },
    { title: "正在研究", items: typeSection(threads, ["research"]), defaultType: "research" },
    { title: "正在玩的/看的", items: typeSection(threads, ["game", "novel", "anime", "video"]), defaultType: "game" },
    { title: "工作流入口", items: typeSection(threads, ["entry"]), defaultType: "entry" },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">manboard</h1>
          <p className="text-sm text-slate-500">个人中枢 · {threads.length} 条记录</p>
        </header>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">加载中…</p>
        ) : (
          sections.map((s) => (
            <Section
              key={s.title}
              title={s.title}
              items={s.items}
              defaultType={s.defaultType}
              onAdd={handleCreate}
              onEdit={setEditing}
              onDelete={handleDelete}
              onCycleStatus={handleCycleStatus}
            />
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">编辑</h2>
            <ThreadForm
              initial={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 确认 TypeScript 编译无报错**
```bash
cd dashboard && npm run build 2>&1 | tail -10
# 期望：无 error
```

- [ ] **Step 3: 提交**
```bash
git add dashboard/src/App.tsx
git commit -m "feat(dashboard): refactor to 9-section layout with horizon-based view routing"
```

---

## Task 7：README + 最终验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README.md**

完整替换 `README.md`：
```markdown
# manboard

个人 AI 操作系统的前端壳子。统一聚合今日/本周/长期目标、当前项目、待办、AI 对话摘要、研究方向、正在玩的看的、工作流入口。

## 项目结构

\`\`\`
manboard/
├── core/          # 后端：FastAPI + Pydantic，Storage 抽象，Connector 契约
├── dashboard/     # 前端：Vite + React + TS + Tailwind
├── data/          # 私有数据（gitignore）；data/sample/ 为样例集
└── openspec/      # 变更规格（comet 流程产物）
\`\`\`

开源的是框架，不是你的数据。`data/` 下的真实数据已被 .gitignore 排除。

## 快速开始

### 1. 启动后端（core）

\`\`\`bash
cd core
pip install -r requirements.txt
MANBOARD_DATA_FILE=../data/threads.json python -m uvicorn app.main:app --reload --port 8000
\`\`\`

API 文档：http://localhost:8000/docs

### 2. 启动前端（dashboard）

\`\`\`bash
cd dashboard
npm install
npm run dev
\`\`\`

前端：http://localhost:5173

## 数据说明

- 真实数据存放在 `data/threads.json`（已 gitignore，不入库）
- `data/sample/threads.json` 是可入库的样例集，供演示
- 数据路径可通过环境变量 `MANBOARD_DATA_FILE` 覆盖

## 面板分区

9 个固定分区，分区逻辑：
- **时间区**（今日/本周/长期目标）：条目的 `horizon` 字段决定归属，与 type 无关
- **内容区**（项目/待办/AI摘要等）：`horizon=none` 且 type 匹配的条目
- 同一条目只出现在一个分区（视图排他）

## 测试

\`\`\`bash
cd core && python -m pytest tests/ -v
\`\`\`
```

- [ ] **Step 2: 运行全部后端测试最终确认**
```bash
cd core && python -m pytest tests/ -v
# 期望：全部 PASS
```

- [ ] **Step 3: 前端构建最终确认**
```bash
cd dashboard && npm run build 2>&1 | tail -5
# 期望：无 error
```

- [ ] **Step 4: 提交**
```bash
git add README.md
git commit -m "docs: update README for three-layer structure and new startup instructions"
```

---

## 自检（spec coverage）

| spec 要求 | 对应 Task |
|---|---|
| 目录三层化（core/dashboard/data） | Task 1 |
| Horizon 枚举 + entry type | Task 2 |
| Storage Protocol + JsonStorage + 懒迁移 | Task 3 |
| get_storage() 工厂 + 环境变量配置 | Task 3 |
| Connector Protocol 契约 | Task 4 |
| routes Depends 注入 | Task 4 |
| API 支持 horizon 读写、非法枚举 422 | Task 4 |
| dashboard types 加 horizon/entry | Task 5 |
| ThreadForm 加 horizon 选择器 | Task 5 |
| 9 分区布局（视图排他） | Task 6 |
| 分区内 priority 排序 | Task 6 |
| 空分区占位 | Task 6 |
| 私有数据 gitignore + 样例集 | Task 1 |
| README 更新 | Task 7 |
| pytest 后端测试 | Task 2/3/4 |


export const HORIZON_LABELS: Record<ThreadHorizon, string> = {
  today: "今日",
  week: "本周",
  long: "长期",
  none: "无时间轴",
};
```

- [ ] **Step 2: 更新 dashboard/src/components/ThreadForm.tsx**

在导入中加入 `ThreadHorizon, THREAD_HORIZONS, HORIZON_LABELS`（先在 types/thread.ts 加 `THREAD_HORIZONS` 常量：`export const THREAD_HORIZONS: ThreadHorizon[] = ["today", "week", "long", "none"];`），然后在 `emptyInput` 加 `horizon: "none"`，在表单的类型/状态/优先级行后加第四个下拉框：

```tsx
// emptyInput 中加：
horizon: "none" as ThreadHorizon,

// ThreadForm 中 useEffect 的 initial 分支加：
horizon: initial.horizon ?? "none",

// 表单 grid 改为 grid-cols-2 两行，或在现有三格后加第四格：
<div>
  <label className={labelClass}>时间轴</label>
  <select
    className={fieldClass}
    value={input.horizon ?? "none"}
    onChange={(e) => update("horizon", e.target.value as ThreadHorizon)}
  >
    {THREAD_HORIZONS.map((h) => (
      <option key={h} value={h}>
        {HORIZON_LABELS[h]}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Step 3: TypeScript 编译检查**
```bash
cd dashboard && npx tsc --noEmit
# 期望：无错误
```

- [ ] **Step 4: 提交**
```bash
git add dashboard/src/types/thread.ts dashboard/src/components/ThreadForm.tsx
git commit -m "feat(dashboard): add ThreadHorizon type and horizon selector in ThreadForm"
```

---

## Task 6：dashboard 9 分区面板（App.tsx 重构）

**Files:**
- Modify: `dashboard/src/App.tsx`

**Interfaces:**
- Consumes: `Thread`, `ThreadHorizon`, `TYPE_LABELS`, `HORIZON_LABELS` from `types/thread`
- Produces: 9 分区视图，视图排他分区逻辑，分区内 priority 排序

分区定义：
```
时间区（由 horizon 推导，不限 type）：
  今日目标 → horizon === "today"
  本周目标 → horizon === "week"
  长期目标 → horizon === "long"

内容区（horizon === "none"，由 type 推导）：
  当前项目   → type === "project"
  待办       → type === "todo"
  AI 对话摘要 → type === "ai-chat"
  研究       → type === "research"
  媒体       → type ∈ { "game", "novel", "anime", "video" }
  工作流入口  → type === "entry"
```

- [ ] **Step 1: 替换 dashboard/src/App.tsx**

```tsx
import { useEffect, useState } from "react";
import { api } from "./api/threads";
import { ThreadForm } from "./components/ThreadForm";
import { ThreadCard } from "./components/ThreadCard";
import {
  TYPE_LABELS,
  type Thread,
  type ThreadInput,
  type ThreadStatus,
  type ThreadHorizon,
} from "./types/thread";

const PRIORITY_RANK: Record<string, number> = { now: 0, next: 1, later: 2 };

function sortByPriority(threads: Thread[]): Thread[] {
  return [...threads].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
  );
}

interface SectionConfig {
  key: string;
  label: string;
  filter: (t: Thread) => boolean;
}

const MEDIA_TYPES = new Set(["game", "novel", "anime", "video"]);

const SECTIONS: SectionConfig[] = [
  { key: "today",   label: "今日目标",     filter: (t) => t.horizon === "today" },
  { key: "week",    label: "本周目标",     filter: (t) => t.horizon === "week" },
  { key: "long",    label: "长期目标",     filter: (t) => t.horizon === "long" },
  { key: "project", label: "当前项目",     filter: (t) => t.horizon === "none" && t.type === "project" },
  { key: "todo",    label: "待办",         filter: (t) => t.horizon === "none" && t.type === "todo" },
  { key: "ai-chat", label: "AI 对话摘要",  filter: (t) => t.horizon === "none" && t.type === "ai-chat" },
  { key: "research",label: "正在研究的方向",filter: (t) => t.horizon === "none" && t.type === "research" },
  { key: "media",   label: "正在玩的/看的", filter: (t) => t.horizon === "none" && MEDIA_TYPES.has(t.type) },
  { key: "entry",   label: "工作流入口",   filter: (t) => t.horizon === "none" && t.type === "entry" },
];

function Section({
  config,
  threads,
  onEdit,
  onDelete,
  onCycleStatus,
  onAdd,
}: {
  config: SectionConfig;
  threads: Thread[];
  onEdit: (t: Thread) => void;
  onDelete: (id: string) => void;
  onCycleStatus: (t: Thread, next: ThreadStatus) => void;
  onAdd: (section: SectionConfig) => void;
}) {
  const items = sortByPriority(threads.filter(config.filter));
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {config.label}
          <span className="ml-1.5 text-xs font-normal text-slate-400">({items.length})</span>
        </h2>
        <button
          onClick={() => onAdd(config)}
          className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          + 新增
        </button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-slate-400">
          暂无条目
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((t) => {
            const STATUS_CYCLE: ThreadStatus[] = ["active", "done", "paused", "parked"];
            const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(t.status) + 1) % STATUS_CYCLE.length];
            return (
              <ThreadCard
                key={t.id}
                thread={t}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t.id)}
                onCycleStatus={() => onCycleStatus(t, nextStatus)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Thread | null>(null);
  const [formDefaults, setFormDefaults] = useState<Partial<ThreadInput>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setThreads(await api.listThreads());
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (input: ThreadInput) => {
    await api.createThread(input);
    setShowForm(false);
    setFormDefaults({});
    await load();
  };

  const handleUpdate = async (input: ThreadInput) => {
    if (!editing) return;
    await api.updateThread(editing.id, input);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除？")) return;
    await api.deleteThread(id);
    await load();
  };

  const handleCycleStatus = async (thread: Thread, next: ThreadStatus) => {
    await api.updateThread(thread.id, { status: next });
    await load();
  };

  const handleAddInSection = (section: SectionConfig) => {
    // 预填该分区对应的默认字段
    const defaults: Partial<ThreadInput> = {};
    if (section.key === "today")    defaults.horizon = "today";
    else if (section.key === "week") defaults.horizon = "week";
    else if (section.key === "long") defaults.horizon = "long";
    else {
      defaults.horizon = "none";
      if (section.key === "project") defaults.type = "project";
      else if (section.key === "todo") defaults.type = "todo";
      else if (section.key === "ai-chat") defaults.type = "ai-chat";
      else if (section.key === "research") defaults.type = "research";
      else if (section.key === "media") defaults.type = "game";
      else if (section.key === "entry") defaults.type = "entry";
    }
    setFormDefaults(defaults);
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">manboard</h1>
            <p className="text-sm text-slate-500">个人中枢 · {threads.length} 条记录</p>
          </div>
          <button
            onClick={() => { setEditing(null); setFormDefaults({}); setShowForm(true); }}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + 新增
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">加载中…</p>
        ) : (
          SECTIONS.map((sec) => (
            <Section
              key={sec.key}
              config={sec}
              threads={threads}
              onEdit={(t) => { setEditing(t); setShowForm(false); }}
              onDelete={handleDelete}
              onCycleStatus={handleCycleStatus}
              onAdd={handleAddInSection}
            />
          ))
        )}
      </div>

      {(showForm || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              {editing ? "编辑条目" : "新增条目"}
            </h2>
            <ThreadForm
              initial={editing ?? (Object.keys(formDefaults).length ? { ...formDefaults } as Thread : null)}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditing(null); setFormDefaults({}); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 编译检查**
```bash
cd dashboard && npx tsc --noEmit
# 期望：无错误
```

- [ ] **Step 3: 提交**
```bash
git add dashboard/src/App.tsx
git commit -m "feat(dashboard): refactor to 9-section panel with horizon+type view routing"
```

---

## Task 7：更新 README + 端到端验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README.md**

将根目录的 README.md 替换为：
```markdown
# manboard

个人 AI 操作系统的前端壳子。统一聚合今日/本周/长期目标、当前项目、待办、AI 对话摘要、研究方向、正在玩的看的、工作流入口。

## 项目结构

\`\`\`
manboard/
├── core/           # 后端：FastAPI + Pydantic（数据模型、Storage、Connector）
├── dashboard/      # 前端：Vite + React + TS + Tailwind
├── data/           # 私有数据（gitignore，不入库）
│   └── sample/     # 脱敏样例数据（入库，供演示）
└── openspec/       # 变更规格文档
\`\`\`

## 快速开始

### 1. 启动后端（core）

\`\`\`bash
cd core
pip install -r requirements.txt
MANBOARD_DATA_FILE=../data/threads.json python -m uvicorn app.main:app --reload --port 8000
\`\`\`

API 文档：http://localhost:8000/docs

### 2. 启动前端（dashboard）

\`\`\`bash
cd dashboard
npm install
npm run dev
\`\`\`

面板：http://localhost:5173

## 数据说明

- `data/` 目录已加入 `.gitignore`，你的真实数据不会入库
- `data/sample/` 包含脱敏样例数据，clone 后可直接体验
- 数据路径通过环境变量 `MANBOARD_DATA_FILE` 配置，默认 `data/threads.json`

## 开源说明

框架（core + dashboard）可开源。你的数据（`data/`）不在开源范围内。
```

- [ ] **Step 2: 运行全部后端测试**
```bash
cd core && python -m pytest tests/ -v
# 期望：全部 PASS
```

- [ ] **Step 3: 端到端验证**

终端 1（core 目录）：
```bash
MANBOARD_DATA_FILE=../data/threads.json python -m uvicorn app.main:app --reload --port 8000
```

终端 2（dashboard 目录）：
```bash
npm run dev
```

浏览器打开 http://localhost:5173，手动验证：
- [ ] 9 个分区全部可见（即使为空）
- [ ] 点击任意分区的「+ 新增」，表单预填了正确的 horizon 或 type
- [ ] 新增条目后刷新页面，条目仍在（落盘）
- [ ] 将一个 todo 设 horizon=today，它出现在「今日目标」分区，不出现在「待办」分区
- [ ] 删除条目后消失

- [ ] **Step 4: 提交**
```bash
git add README.md
git commit -m "docs: update README for three-layer structure and new startup instructions"
```

---

## 自检（Spec 覆盖）

| Spec 要求 | 覆盖任务 |
|---|---|
| 三层目录结构（core/dashboard/data） | Task 1 |
| 私有数据 gitignore + 样例集 | Task 1 |
| horizon 枚举（today/week/long/none）默认 none | Task 2 |
| entry type | Task 2 |
| 非法枚举被拒 422 | Task 2 + Task 4 |
| Storage Protocol + JsonStorage | Task 3 |
| 懒迁移（缺 horizon 旧条目补 none） | Task 3 |
| 存储路径可配置（MANBOARD_DATA_FILE） | Task 3 |
| Connector Protocol 契约（无实现） | Task 4 |
| routes 用 Depends(get_storage) 注入 | Task 4 |
| 9 分区面板 + 时间区/内容区视图排他 | Task 6 |
| 分区内 priority 排序 | Task 6 |
| 手动 CRUD + 分区预填默认字段 | Task 6 |
| 空分区占位 | Task 6 |
| horizon 字段可在表单选择 | Task 5 |
| README 更新 | Task 7 |
