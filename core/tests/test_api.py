import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Horizon, ThreadCreate, ThreadType
from app.storage import JsonStorage, get_storage
from app.connectors import Connector


@pytest.fixture
def client(tmp_path):
    path = str(tmp_path / "threads.json")
    store = JsonStorage(path)
    app.dependency_overrides[get_storage] = lambda: store
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_create_and_list(client):
    r = client.post("/threads", json={"title": "API item", "type": "todo"})
    assert r.status_code == 201
    body = r.json()
    assert body["horizon"] == "none"

    r = client.get("/threads")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_create_with_horizon(client):
    r = client.post("/threads", json={"title": "Today task", "type": "todo", "horizon": "today"})
    assert r.status_code == 201
    assert r.json()["horizon"] == "today"


def test_invalid_horizon_returns_422(client):
    r = client.post("/threads", json={"title": "Bad", "type": "todo", "horizon": "yesterday"})
    assert r.status_code == 422


def test_get_thread(client):
    created = client.post("/threads", json={"title": "Fetch me", "type": "project"}).json()
    r = client.get(f"/threads/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_get_missing_returns_404(client):
    r = client.get("/threads/nope")
    assert r.status_code == 404


def test_update_thread(client):
    created = client.post("/threads", json={"title": "Old", "type": "todo"}).json()
    r = client.patch(f"/threads/{created['id']}", json={"title": "New", "horizon": "week"})
    assert r.status_code == 200
    assert r.json()["title"] == "New"
    assert r.json()["horizon"] == "week"


def test_delete_thread(client):
    created = client.post("/threads", json={"title": "Bye", "type": "todo"}).json()
    r = client.delete(f"/threads/{created['id']}")
    assert r.status_code == 204
    assert client.get(f"/threads/{created['id']}").status_code == 404


def test_delete_missing_returns_404(client):
    r = client.delete("/threads/ghost")
    assert r.status_code == 404


def test_entry_type_via_api(client):
    r = client.post("/threads", json={"title": "Docs link", "type": "entry", "notes": "https://example.com"})
    assert r.status_code == 201
    assert r.json()["type"] == "entry"


def test_connector_protocol_contract():
    class MockConnector:
        def fetch(self):
            return []

    assert isinstance(MockConnector(), Connector)
