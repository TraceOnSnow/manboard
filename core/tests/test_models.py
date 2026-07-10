import pytest
from pydantic import ValidationError
from app.models import Thread, ThreadCreate, ThreadUpdate, Horizon, ThreadType


def test_horizon_default_is_none():
    t = ThreadCreate(title="test", type=ThreadType.todo)
    assert t.horizon == Horizon.none


def test_horizon_valid_values():
    for h in ("today", "week", "long", "none"):
        t = ThreadCreate(title="test", type=ThreadType.todo, horizon=h)
        assert t.horizon.value == h


def test_horizon_invalid_value_raises():
    with pytest.raises(ValidationError):
        ThreadCreate(title="test", type=ThreadType.todo, horizon="invalid")


def test_entry_type_accepted():
    t = ThreadCreate(title="Claude docs", type=ThreadType.entry)
    assert t.type == ThreadType.entry


def test_thread_update_horizon_optional():
    u = ThreadUpdate(horizon="week")
    assert u.horizon == Horizon.week


def test_thread_update_all_none():
    u = ThreadUpdate()
    assert u.horizon is None
