import json
import os
import pytest
from app.models import Horizon, ThreadCreate, ThreadType, ThreadUpdate
from app.storage import JsonStorage, Storage


@pytest.fixture
def store(tmp_path):
    path = str(tmp_path / "threads.json")
    return JsonStorage(path)


def test_storage_satisfies_protocol(store):
    assert isinstance(store, Storage)


def test_create_and_list(store):
    payload = ThreadCreate(title="Test item", type=ThreadType.todo)
    created = store.create(payload)
    assert created.id
    assert created.horizon == Horizon.none
    items = store.list()
    assert len(items) == 1
    assert items[0].id == created.id


def test_get(store):
    created = store.create(ThreadCreate(title="Get me", type=ThreadType.project))
    fetched = store.get(created.id)
    assert fetched.title == "Get me"


def test_get_missing_raises(store):
    with pytest.raises(KeyError):
        store.get("nonexistent")


def test_update(store):
    created = store.create(ThreadCreate(title="Old", type=ThreadType.todo))
    updated = store.update(created.id, ThreadUpdate(title="New", horizon="today"))
    assert updated.title == "New"
    assert updated.horizon == Horizon.today


def test_update_missing_raises(store):
    with pytest.raises(KeyError):
        store.update("nonexistent", ThreadUpdate(title="x"))


def test_delete(store):
    created = store.create(ThreadCreate(title="Gone", type=ThreadType.todo))
    assert store.delete(created.id) is True
    assert store.list() == []


def test_delete_missing_returns_false(store):
    assert store.delete("ghost") is False


def test_lazy_migration_adds_horizon(store, tmp_path):
    # write a record without horizon field (simulates old data)
    old_record = {
        "old-id": {
            "id": "old-id",
            "title": "Legacy",
            "type": "todo",
            "status": "active",
            "priority": "next",
            "area": None,
            "nextAction": None,
            "notes": None,
            "lastTouched": "2026-01-01T00:00:00+00:00",
            "createdAt": "2026-01-01T00:00:00+00:00",
            "updatedAt": "2026-01-01T00:00:00+00:00",
        }
    }
    path = str(tmp_path / "threads.json")
    with open(path, "w") as f:
        json.dump(old_record, f)

    legacy_store = JsonStorage(path)
    items = legacy_store.list()
    assert len(items) == 1
    assert items[0].horizon == Horizon.none


def test_data_persists_across_instances(store, tmp_path):
    path = str(tmp_path / "threads.json")
    s1 = JsonStorage(path)
    created = s1.create(ThreadCreate(title="Persist me", type=ThreadType.todo))

    s2 = JsonStorage(path)
    items = s2.list()
    assert len(items) == 1
    assert items[0].id == created.id
