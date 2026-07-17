from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class TaskPriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class BoxLayout(BaseModel):
    x: int = Field(ge=0, le=11)
    y: int = Field(ge=0)
    w: int = Field(ge=1, le=12)
    h: int = Field(ge=2, le=24)

    @model_validator(mode="after")
    def fit_within_twelve_columns(self):
        if self.x + self.w > 12:
            raise ValueError("Box layout must fit within the 12-column grid")
        return self


class BoxBase(BaseModel):
    title: str = Field(min_length=1, max_length=80)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("title cannot be blank")
        return title


class BoxCreate(BoxBase):
    layout: BoxLayout


class BoxUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=80)
    layout: BoxLayout | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        title = value.strip()
        if not title:
            raise ValueError("title cannot be blank")
        return title


class Box(BoxBase):
    id: str
    layout: BoxLayout
    createdAt: str
    updatedAt: str


def _normalize_tags(value: list[str]) -> list[str]:
    return list(dict.fromkeys(tag.strip() for tag in value if tag.strip()))


def _validate_due_date(value: str | None) -> str | None:
    if value is not None:
        date.fromisoformat(value)
    return value


def _validate_completed_at(value: str | None) -> str | None:
    if value is not None:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    boxId: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    priority: TaskPriority | None = None
    dueDate: str | None = None
    details: str | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("title cannot be blank")
        return title

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: list[str]) -> list[str]:
        return _normalize_tags(value)

    @field_validator("dueDate")
    @classmethod
    def validate_due_date(cls, value: str | None) -> str | None:
        return _validate_due_date(value)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    boxId: str | None = Field(default=None, min_length=1)
    tags: list[str] | None = None
    priority: TaskPriority | None = None
    dueDate: str | None = None
    details: str | None = None
    completedAt: str | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        title = value.strip()
        if not title:
            raise ValueError("title cannot be blank")
        return title

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: list[str] | None) -> list[str] | None:
        return None if value is None else _normalize_tags(value)

    @field_validator("dueDate")
    @classmethod
    def validate_due_date(cls, value: str | None) -> str | None:
        return _validate_due_date(value)

    @field_validator("completedAt")
    @classmethod
    def validate_completed_at(cls, value: str | None) -> str | None:
        return _validate_completed_at(value)


class Task(TaskBase):
    id: str
    completedAt: str | None = None
    position: int = Field(ge=0)
    createdAt: str
    updatedAt: str


class BoxDelete(BaseModel):
    taskDisposition: Literal["delete", "move"]
    targetBoxId: str | None = None

    @model_validator(mode="after")
    def require_target_when_moving_tasks(self):
        if self.taskDisposition == "move" and not self.targetBoxId:
            raise ValueError("targetBoxId is required when moving tasks")
        return self
