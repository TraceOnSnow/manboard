import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Protocol, runtime_checkable

from .models import Box, BoxCreate, BoxDelete, BoxUpdate, Task, TaskCreate, TaskUpdate

BOARD_VERSION = 2
DEFAULT_INBOX_LAYOUT = {"x": 0, "y": 0, "w": 4, "h": 6}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


@runtime_checkable
class Storage(Protocol):
    def list_boxes(self) -> list[Box]: ...
    def create_box(self, payload: BoxCreate) -> Box: ...
    def update_box(self, box_id: str, payload: BoxUpdate) -> Box: ...
    def delete_box(self, box_id: str, payload: BoxDelete) -> None: ...
    def list_tasks(self) -> list[Task]: ...
    def get_task(self, task_id: str) -> Task: ...
    def create_task(self, payload: TaskCreate) -> Task: ...
    def update_task(self, task_id: str, payload: TaskUpdate) -> Task: ...
    def delete_task(self, task_id: str) -> bool: ...


class JsonStorage:
    def __init__(self, path: str) -> None:
        self._path = path
        self._lock = Lock()

    def _new_board(self) -> dict[str, Any]:
        now = _now_iso()
        return {
            "version": BOARD_VERSION,
            "boxes": [
                {
                    "id": _new_id(),
                    "title": "Inbox",
                    "layout": DEFAULT_INBOX_LAYOUT.copy(),
                    "createdAt": now,
                    "updatedAt": now,
                }
            ],
            "tasks": [],
        }

    def _read_raw(self) -> object | None:
        if not os.path.exists(self._path):
            return None
        try:
            with open(self._path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (json.JSONDecodeError, OSError):
            return None

    @staticmethod
    def _is_board_document(data: object) -> bool:
        return (
            isinstance(data, dict)
            and data.get("version") == BOARD_VERSION
            and isinstance(data.get("boxes"), list)
            and isinstance(data.get("tasks"), list)
        )

    def _save_board(self, board: dict[str, Any]) -> None:
        parent = os.path.dirname(self._path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        temporary_path = f"{self._path}.tmp"
        with open(temporary_path, "w", encoding="utf-8") as handle:
            json.dump(board, handle, ensure_ascii=False, indent=2)
        os.replace(temporary_path, self._path)

    def _backup_legacy_file(self) -> None:
        backup_path = f"{self._path}.bak"
        if os.path.exists(self._path) and not os.path.exists(backup_path):
            shutil.copy2(self._path, backup_path)

    @staticmethod
    def _legacy_priority(value: object) -> str | None:
        return {"now": "high", "next": "medium", "later": "low"}.get(value if isinstance(value, str) else "")

    @staticmethod
    def _legacy_details(record: dict[str, Any]) -> str | None:
        sections: list[str] = []
        next_action = record.get("nextAction")
        notes = record.get("notes")
        if isinstance(next_action, str) and next_action.strip():
            sections.append(f"下一步动作\n{next_action.strip()}")
        if isinstance(notes, str) and notes.strip():
            sections.append(f"备注\n{notes.strip()}")
        return "\n\n".join(sections) or None

    def _migrate_legacy_threads(self, legacy: dict[str, Any]) -> dict[str, Any]:
        board = self._new_board()
        inbox_id = board["boxes"][0]["id"]
        tasks: list[dict[str, Any]] = []
        now = _now_iso()
        for position, raw in enumerate(legacy.values()):
            if not isinstance(raw, dict):
                continue
            task_id = raw.get("id") if isinstance(raw.get("id"), str) and raw["id"] else _new_id()
            created_at = raw.get("createdAt") if isinstance(raw.get("createdAt"), str) else now
            updated_at = raw.get("updatedAt") if isinstance(raw.get("updatedAt"), str) else created_at
            tags: list[str] = []
            for candidate in (raw.get("type"), raw.get("area")):
                if isinstance(candidate, str) and candidate.strip() and candidate.strip() not in tags:
                    tags.append(candidate.strip())
            tasks.append(
                {
                    "id": task_id,
                    "title": str(raw.get("title") or "未命名任务").strip() or "未命名任务",
                    "boxId": inbox_id,
                    "tags": tags,
                    "priority": self._legacy_priority(raw.get("priority")),
                    "dueDate": None,
                    "details": self._legacy_details(raw),
                    "completedAt": updated_at if raw.get("status") == "done" else None,
                    "position": position,
                    "createdAt": created_at,
                    "updatedAt": updated_at,
                }
            )
        board["tasks"] = tasks
        return board

    def _load_board(self) -> dict[str, Any]:
        raw = self._read_raw()
        if self._is_board_document(raw):
            return raw
        if raw is None:
            board = self._new_board()
            self._save_board(board)
            return board
        if isinstance(raw, dict):
            self._backup_legacy_file()
            board = self._migrate_legacy_threads(raw)
            self._save_board(board)
            return board
        board = self._new_board()
        self._save_board(board)
        return board

    @staticmethod
    def _box_record(board: dict[str, Any], box_id: str) -> dict[str, Any]:
        for record in board["boxes"]:
            if record["id"] == box_id:
                return record
        raise KeyError(box_id)

    @staticmethod
    def _task_record(board: dict[str, Any], task_id: str) -> dict[str, Any]:
        for record in board["tasks"]:
            if record["id"] == task_id:
                return record
        raise KeyError(task_id)

    @staticmethod
    def _task_sort_key(record: dict[str, Any]) -> tuple[int, int]:
        return (int(record.get("completedAt") is not None), int(record.get("position", 0)))

    @staticmethod
    def _next_position(board: dict[str, Any], box_id: str) -> int:
        positions = [int(record.get("position", 0)) for record in board["tasks"] if record.get("boxId") == box_id]
        return max(positions, default=-1) + 1

    def list_boxes(self) -> list[Box]:
        return [Box(**record) for record in self._load_board()["boxes"]]

    def create_box(self, payload: BoxCreate) -> Box:
        with self._lock:
            board = self._load_board()
            now = _now_iso()
            record = {
                "id": _new_id(),
                **payload.model_dump(mode="json"),
                "createdAt": now,
                "updatedAt": now,
            }
            board["boxes"].append(record)
            self._save_board(board)
            return Box(**record)

    def update_box(self, box_id: str, payload: BoxUpdate) -> Box:
        with self._lock:
            board = self._load_board()
            record = self._box_record(board, box_id)
            record.update(payload.model_dump(exclude_unset=True, mode="json"))
            record["updatedAt"] = _now_iso()
            self._save_board(board)
            return Box(**record)

    def delete_box(self, box_id: str, payload: BoxDelete) -> None:
        with self._lock:
            board = self._load_board()
            self._box_record(board, box_id)
            source_tasks = [task for task in board["tasks"] if task["boxId"] == box_id]
            if payload.taskDisposition == "move":
                target_box_id = payload.targetBoxId
                if target_box_id == box_id:
                    raise ValueError("targetBoxId must refer to a different Box")
                try:
                    self._box_record(board, target_box_id or "")
                except KeyError as error:
                    raise ValueError("targetBoxId must refer to an existing Box") from error
                now = _now_iso()
                next_position = self._next_position(board, target_box_id or "")
                for task in sorted(source_tasks, key=self._task_sort_key):
                    task["boxId"] = target_box_id
                    task["position"] = next_position
                    task["updatedAt"] = now
                    next_position += 1
            else:
                board["tasks"] = [task for task in board["tasks"] if task["boxId"] != box_id]
            board["boxes"] = [box for box in board["boxes"] if box["id"] != box_id]
            self._save_board(board)

    def list_tasks(self) -> list[Task]:
        board = self._load_board()
        records = sorted(board["tasks"], key=self._task_sort_key)
        return [Task(**record) for record in records]

    def get_task(self, task_id: str) -> Task:
        return Task(**self._task_record(self._load_board(), task_id))

    def create_task(self, payload: TaskCreate) -> Task:
        with self._lock:
            board = self._load_board()
            try:
                self._box_record(board, payload.boxId)
            except KeyError as error:
                raise ValueError("Box not found") from error
            now = _now_iso()
            record = {
                "id": _new_id(),
                **payload.model_dump(mode="json"),
                "completedAt": None,
                "position": self._next_position(board, payload.boxId),
                "createdAt": now,
                "updatedAt": now,
            }
            board["tasks"].append(record)
            self._save_board(board)
            return Task(**record)

    def update_task(self, task_id: str, payload: TaskUpdate) -> Task:
        with self._lock:
            board = self._load_board()
            record = self._task_record(board, task_id)
            updates = payload.model_dump(exclude_unset=True, mode="json")
            next_box_id = updates.get("boxId", record["boxId"])
            try:
                self._box_record(board, next_box_id)
            except KeyError as error:
                raise ValueError("Box not found") from error
            if next_box_id != record["boxId"]:
                updates["position"] = self._next_position(board, next_box_id)
            record.update(updates)
            record["updatedAt"] = _now_iso()
            self._save_board(board)
            return Task(**record)

    def delete_task(self, task_id: str) -> bool:
        with self._lock:
            board = self._load_board()
            try:
                self._task_record(board, task_id)
            except KeyError:
                return False
            board["tasks"] = [task for task in board["tasks"] if task["id"] != task_id]
            self._save_board(board)
            return True


def get_storage() -> Storage:
    path = os.getenv("MANBOARD_DATA_FILE", "data/threads.json")
    return JsonStorage(path)
