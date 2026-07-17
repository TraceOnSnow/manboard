import json

import pytest

from app.models import BoxCreate, BoxDelete, TaskCreate, TaskUpdate
from app.storage import JsonStorage, Storage


@pytest.fixture
def store(tmp_path):
    return JsonStorage(str(tmp_path / "threads.json"))


def layout(x=0, y=0, w=4, h=6):
    return {"x": x, "y": y, "w": w, "h": h}


def test_storage_satisfies_protocol(store):
    assert isinstance(store, Storage)


def test_a_new_board_starts_with_one_persisted_inbox(store):
    boxes = store.list_boxes()

    assert [box.title for box in boxes] == ["Inbox"]
    assert boxes[0].layout.model_dump() == layout()
    assert store.list_tasks() == []


def test_legacy_threads_migrate_once_into_inbox_and_back_up(tmp_path):
    path = tmp_path / "threads.json"
    path.write_text(
        json.dumps(
            {
                "old": {
                    "id": "old",
                    "title": "Legacy",
                    "type": "todo",
                    "area": "work",
                    "status": "done",
                    "priority": "now",
                    "nextAction": "Ship it",
                    "notes": "Keep notes",
                    "createdAt": "2026-01-01T00:00:00+00:00",
                    "updatedAt": "2026-01-02T00:00:00+00:00",
                    "lastTouched": "2026-01-02T00:00:00+00:00",
                }
            }
        ),
        encoding="utf-8",
    )
    store = JsonStorage(str(path))

    boxes = store.list_boxes()
    tasks = store.list_tasks()

    assert [box.title for box in boxes] == ["Inbox"]
    assert tasks[0].boxId == boxes[0].id
    assert tasks[0].tags == ["todo", "work"]
    assert tasks[0].priority.value == "high"
    assert tasks[0].completedAt == "2026-01-02T00:00:00+00:00"
    assert "下一步动作\nShip it" in tasks[0].details
    assert "备注\nKeep notes" in tasks[0].details
    assert path.with_suffix(".json.bak").exists()
    assert store.list_boxes() == boxes
    assert json.loads(path.read_text(encoding="utf-8"))["version"] == 2


def test_box_and_task_data_persist_across_instances(tmp_path):
    path = tmp_path / "threads.json"
    first = JsonStorage(str(path))
    inbox = first.list_boxes()[0]
    created = first.create_task(TaskCreate(title="Persist me", boxId=inbox.id))

    second = JsonStorage(str(path))

    assert second.get_task(created.id).title == "Persist me"
    assert second.list_boxes()[0].id == inbox.id


def test_task_must_reference_an_existing_box(store):
    with pytest.raises(ValueError, match="Box not found"):
        store.create_task(TaskCreate(title="Orphan", boxId="missing"))


def test_updating_a_task_to_an_unknown_box_is_rejected(store):
    inbox = store.list_boxes()[0]
    task = store.create_task(TaskCreate(title="Move me", boxId=inbox.id))

    with pytest.raises(ValueError, match="Box not found"):
        store.update_task(task.id, TaskUpdate(boxId="missing"))


def test_tasks_sort_open_before_completed_and_keep_position(store):
    inbox = store.list_boxes()[0]
    done = store.create_task(TaskCreate(title="Done", boxId=inbox.id))
    first = store.create_task(TaskCreate(title="First", boxId=inbox.id))
    second = store.create_task(TaskCreate(title="Second", boxId=inbox.id))
    store.update_task(done.id, TaskUpdate(completedAt="2026-07-17T10:00:00+00:00"))

    assert [task.id for task in store.list_tasks()] == [first.id, second.id, done.id]


def test_delete_box_moves_every_task_to_target(store):
    inbox = store.list_boxes()[0]
    later = store.create_box(BoxCreate(title="Later", layout=layout(4)))
    task = store.create_task(TaskCreate(title="Move me", boxId=inbox.id))

    store.delete_box(inbox.id, BoxDelete(taskDisposition="move", targetBoxId=later.id))

    assert store.get_task(task.id).boxId == later.id
    assert store.list_boxes() == [later]


def test_delete_box_can_remove_its_tasks(store):
    inbox = store.list_boxes()[0]
    task = store.create_task(TaskCreate(title="Delete me", boxId=inbox.id))

    store.delete_box(inbox.id, BoxDelete(taskDisposition="delete"))

    with pytest.raises(KeyError):
        store.get_task(task.id)
    assert store.list_boxes() == []


def test_moving_box_tasks_requires_a_different_existing_target(store):
    inbox = store.list_boxes()[0]

    with pytest.raises(ValueError, match="different"):
        store.delete_box(inbox.id, BoxDelete(taskDisposition="move", targetBoxId=inbox.id))

    with pytest.raises(ValueError, match="target"):
        store.delete_box(inbox.id, BoxDelete(taskDisposition="move", targetBoxId="missing"))
