import pytest
from pydantic import ValidationError

from app.models import BoxCreate, BoxDelete, TaskCreate, TaskPriority, TaskUpdate


def test_task_accepts_one_box_and_a_single_due_date():
    task = TaskCreate(title="Pay bill", boxId="inbox", dueDate="2026-07-18")

    assert task.boxId == "inbox"
    assert task.dueDate == "2026-07-18"


def test_task_rejects_non_iso_due_date():
    with pytest.raises(ValidationError):
        TaskCreate(title="Bad date", boxId="inbox", dueDate="2026/07/18")


def test_task_priority_only_accepts_high_medium_low():
    assert TaskCreate(title="P", boxId="inbox", priority="high").priority is TaskPriority.high

    with pytest.raises(ValidationError):
        TaskCreate(title="P", boxId="inbox", priority="now")


def test_tags_are_trimmed_and_deduplicated():
    task = TaskCreate(title="Tagged", boxId="inbox", tags=[" work ", "", "work", "生活"])

    assert task.tags == ["work", "生活"]


def test_box_layout_cannot_leave_the_twelve_column_grid():
    with pytest.raises(ValidationError):
        BoxCreate(title="Too wide", layout={"x": 0, "y": 0, "w": 13, "h": 4})


def test_move_disposition_requires_a_target_box():
    with pytest.raises(ValidationError):
        BoxDelete(taskDisposition="move")


def test_task_update_preserves_explicit_completion_clear():
    update = TaskUpdate(completedAt=None)

    assert update.model_dump(exclude_unset=True) == {"completedAt": None}
