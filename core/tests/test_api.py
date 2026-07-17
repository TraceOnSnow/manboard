import httpx2
import pytest
import pytest_asyncio

from app.connectors import Connector
from app.main import app
from app.storage import JsonStorage, get_storage


@pytest_asyncio.fixture
async def client(tmp_path):
    store = JsonStorage(str(tmp_path / "threads.json"))
    async def get_test_storage():
        return store

    app.dependency_overrides[get_storage] = get_test_storage
    transport = httpx2.ASGITransport(app=app)
    async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as api_client:
        yield api_client
    app.dependency_overrides.clear()


async def create_box(client, title="Box", x=4):
    response = await client.post(
        "/boxes",
        json={"title": title, "layout": {"x": x, "y": 0, "w": 4, "h": 6}},
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_boxes_starts_with_an_inbox(client):
    response = await client.get("/boxes")

    assert response.status_code == 200
    boxes = response.json()
    assert len(boxes) == 1
    assert boxes[0]["title"] == "Inbox"
    assert boxes[0]["layout"] == {"x": 0, "y": 0, "w": 4, "h": 6}


@pytest.mark.asyncio
async def test_create_update_and_delete_box(client):
    created = await create_box(client, title="今日待办")

    updated = await client.patch(
        f"/boxes/{created['id']}",
        json={"title": "今天", "layout": {"x": 6, "y": 2, "w": 6, "h": 8}},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "今天"
    assert updated.json()["layout"] == {"x": 6, "y": 2, "w": 6, "h": 8}

    deleted = await client.request(
        "DELETE", f"/boxes/{created['id']}", json={"taskDisposition": "delete"}
    )
    assert deleted.status_code == 204
    assert all(box["id"] != created["id"] for box in (await client.get("/boxes")).json())


@pytest.mark.asyncio
async def test_missing_box_returns_404(client):
    assert (await client.patch("/boxes/missing", json={"title": "Nope"})).status_code == 404
    assert (
        await client.request("DELETE", "/boxes/missing", json={"taskDisposition": "delete"})
    ).status_code == 404


@pytest.mark.asyncio
async def test_create_list_get_update_and_delete_task(client):
    inbox = (await client.get("/boxes")).json()[0]
    created = await client.post(
        "/tasks",
        json={
            "title": "Ship board",
            "boxId": inbox["id"],
            "tags": ["work", " work "],
            "priority": "high",
            "dueDate": "2026-07-18",
            "details": "Release the new board.",
        },
    )
    assert created.status_code == 201
    task = created.json()
    assert task["tags"] == ["work"]
    assert task["completedAt"] is None

    listed = await client.get("/tasks")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [task["id"]]

    fetched = await client.get(f"/tasks/{task['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["title"] == "Ship board"

    updated = await client.patch(
        f"/tasks/{task['id']}",
        json={"title": "Ship Box board", "priority": "medium", "dueDate": None},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Ship Box board"
    assert updated.json()["priority"] == "medium"
    assert updated.json()["dueDate"] is None

    deleted = await client.delete(f"/tasks/{task['id']}")
    assert deleted.status_code == 204
    assert (await client.get(f"/tasks/{task['id']}")).status_code == 404


@pytest.mark.asyncio
async def test_task_rejects_invalid_priority_due_date_and_unknown_box(client):
    inbox = (await client.get("/boxes")).json()[0]

    assert (
        await client.post("/tasks", json={"title": "Bad priority", "boxId": inbox["id"], "priority": "now"})
    ).status_code == 422
    assert (
        await client.post("/tasks", json={"title": "Bad date", "boxId": inbox["id"], "dueDate": "2026/07/18"})
    ).status_code == 422
    assert (await client.post("/tasks", json={"title": "Orphan", "boxId": "missing"})).status_code == 404


@pytest.mark.asyncio
async def test_task_completion_and_moving_between_boxes(client):
    inbox = (await client.get("/boxes")).json()[0]
    today = await create_box(client, title="今日待办")
    task = (await client.post("/tasks", json={"title": "Ship", "boxId": inbox["id"], "tags": ["work"]})).json()

    completed = await client.patch(
        f"/tasks/{task['id']}", json={"completedAt": "2026-07-17T10:00:00+00:00"}
    )
    moved = await client.patch(f"/tasks/{task['id']}", json={"boxId": today["id"]})

    assert completed.status_code == 200
    assert completed.json()["completedAt"] == "2026-07-17T10:00:00+00:00"
    assert moved.status_code == 200
    assert moved.json()["boxId"] == today["id"]


@pytest.mark.asyncio
async def test_delete_box_can_delete_or_move_its_tasks(client):
    inbox = (await client.get("/boxes")).json()[0]
    delete_task = (await client.post("/tasks", json={"title": "Discard", "boxId": inbox["id"]})).json()

    deleted = await client.request("DELETE", f"/boxes/{inbox['id']}", json={"taskDisposition": "delete"})
    assert deleted.status_code == 204
    assert (await client.get(f"/tasks/{delete_task['id']}")).status_code == 404

    source = await create_box(client, title="Source", x=0)
    target = await create_box(client, title="Target", x=4)
    moving_task = (await client.post("/tasks", json={"title": "Move me", "boxId": source["id"]})).json()

    moved = await client.request(
        "DELETE",
        f"/boxes/{source['id']}",
        json={"taskDisposition": "move", "targetBoxId": target["id"]},
    )
    assert moved.status_code == 204
    assert (await client.get(f"/tasks/{moving_task['id']}")).json()["boxId"] == target["id"]


@pytest.mark.asyncio
async def test_delete_box_requires_a_valid_target_when_moving_tasks(client):
    inbox = (await client.get("/boxes")).json()[0]

    missing_target = await client.request("DELETE", f"/boxes/{inbox['id']}", json={"taskDisposition": "move"})
    assert missing_target.status_code == 422

    same_target = await client.request(
        "DELETE",
        f"/boxes/{inbox['id']}",
        json={"taskDisposition": "move", "targetBoxId": inbox["id"]},
    )
    assert same_target.status_code == 422


@pytest.mark.asyncio
async def test_missing_task_returns_404(client):
    assert (await client.get("/tasks/missing")).status_code == 404
    assert (await client.patch("/tasks/missing", json={"title": "Nope"})).status_code == 404
    assert (await client.delete("/tasks/missing")).status_code == 404


def test_connector_protocol_contract():
    class MockConnector:
        def fetch(self):
            return []

    assert isinstance(MockConnector(), Connector)
