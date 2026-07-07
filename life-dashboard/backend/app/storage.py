import json
import os
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List

from .models import Thread, ThreadCreate, ThreadUpdate

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DATA_FILE = os.path.join(DATA_DIR, "threads.json")

_lock = Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_raw() -> Dict[str, dict]:
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save_raw(data: Dict[str, dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)


def list_threads() -> List[Thread]:
    data = _load_raw()
    return [Thread(**v) for v in data.values()]


def get_thread(thread_id: str) -> Thread:
    data = _load_raw()
    if thread_id not in data:
        raise KeyError(thread_id)
    return Thread(**data[thread_id])


def create_thread(payload: ThreadCreate) -> Thread:
    with _lock:
        data = _load_raw()
        now = _now_iso()
        thread_id = uuid.uuid4().hex[:12]
        record = {
            "id": thread_id,
            "title": payload.title,
            "type": payload.type.value,
            "status": payload.status.value,
            "priority": payload.priority.value,
            "area": payload.area,
            "nextAction": payload.nextAction,
            "notes": payload.notes,
            "lastTouched": now,
            "createdAt": now,
            "updatedAt": now,
        }
        data[thread_id] = record
        _save_raw(data)
        return Thread(**record)


def update_thread(thread_id: str, payload: ThreadUpdate) -> Thread:
    with _lock:
        data = _load_raw()
        if thread_id not in data:
            raise KeyError(thread_id)
        record = data[thread_id]
        # mode="json" serializes enums to their string values; exclude_unset
        # means only fields the client actually sent get overwritten.
        updates = payload.model_dump(exclude_unset=True, mode="json")
        record.update(updates)
        now = _now_iso()
        record["lastTouched"] = now
        record["updatedAt"] = now
        _save_raw(data)
        return Thread(**record)


def delete_thread(thread_id: str) -> bool:
    with _lock:
        data = _load_raw()
        if thread_id not in data:
            return False
        del data[thread_id]
        _save_raw(data)
        return True
