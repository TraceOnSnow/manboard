import json
import os
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List, Optional
from typing import Protocol, runtime_checkable

from .models import Horizon, Thread, ThreadCreate, ThreadUpdate


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@runtime_checkable
class Storage(Protocol):
    def list(self) -> List[Thread]: ...
    def get(self, item_id: str) -> Thread: ...
    def create(self, payload: ThreadCreate) -> Thread: ...
    def update(self, item_id: str, payload: ThreadUpdate) -> Thread: ...
    def delete(self, item_id: str) -> bool: ...


class JsonStorage:
    def __init__(self, path: str) -> None:
        self._path = path
        self._lock = Lock()

    def _migrate(self, record: dict) -> dict:
        if "horizon" not in record or record["horizon"] is None:
            record["horizon"] = Horizon.none.value
        return record

    def _load_raw(self) -> Dict[str, dict]:
        if not os.path.exists(self._path):
            return {}
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, OSError):
            return {}

    def _save_raw(self, data: Dict[str, dict]) -> None:
        os.makedirs(os.path.dirname(self._path), exist_ok=True)
        tmp = self._path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self._path)

    def list(self) -> List[Thread]:
        data = self._load_raw()
        return [Thread(**self._migrate(v)) for v in data.values()]

    def get(self, item_id: str) -> Thread:
        data = self._load_raw()
        if item_id not in data:
            raise KeyError(item_id)
        return Thread(**self._migrate(data[item_id]))

    def create(self, payload: ThreadCreate) -> Thread:
        with self._lock:
            data = self._load_raw()
            now = _now_iso()
            item_id = uuid.uuid4().hex[:12]
            record = {
                "id": item_id,
                **payload.model_dump(mode="json"),
                "lastTouched": now,
                "createdAt": now,
                "updatedAt": now,
            }
            data[item_id] = record
            self._save_raw(data)
            return Thread(**record)

    def update(self, item_id: str, payload: ThreadUpdate) -> Thread:
        with self._lock:
            data = self._load_raw()
            if item_id not in data:
                raise KeyError(item_id)
            record = self._migrate(data[item_id])
            updates = payload.model_dump(exclude_unset=True, mode="json")
            record.update(updates)
            now = _now_iso()
            record["lastTouched"] = now
            record["updatedAt"] = now
            data[item_id] = record
            self._save_raw(data)
            return Thread(**record)

    def delete(self, item_id: str) -> bool:
        with self._lock:
            data = self._load_raw()
            if item_id not in data:
                return False
            del data[item_id]
            self._save_raw(data)
            return True


def get_storage() -> Storage:
    path = os.getenv("MANBOARD_DATA_FILE", "data/threads.json")
    return JsonStorage(path)
