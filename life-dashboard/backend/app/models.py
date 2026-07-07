from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ThreadType(str, Enum):
    goal = "goal"
    project = "project"
    research = "research"
    todo = "todo"
    game = "game"
    novel = "novel"
    anime = "anime"
    video = "video"
    ai_chat = "ai-chat"
    self_improvement = "self-improvement"
    other = "other"


class ThreadStatus(str, Enum):
    active = "active"
    paused = "paused"
    parked = "parked"
    done = "done"


class ThreadPriority(str, Enum):
    now = "now"
    next = "next"
    later = "later"


class ThreadBase(BaseModel):
    title: str = Field(..., min_length=1)
    type: ThreadType
    status: ThreadStatus = ThreadStatus.active
    priority: ThreadPriority = ThreadPriority.next
    area: Optional[str] = None
    nextAction: Optional[str] = None
    notes: Optional[str] = None


class ThreadCreate(ThreadBase):
    pass


class ThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    type: Optional[ThreadType] = None
    status: Optional[ThreadStatus] = None
    priority: Optional[ThreadPriority] = None
    area: Optional[str] = None
    nextAction: Optional[str] = None
    notes: Optional[str] = None


class Thread(ThreadBase):
    id: str
    lastTouched: str
    createdAt: str
    updatedAt: str
