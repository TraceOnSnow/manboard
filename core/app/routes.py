from fastapi import APIRouter, HTTPException, status

from .models import ThreadCreate, ThreadUpdate, Thread
from . import storage

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("", response_model=list[Thread])
def list_threads():
    return storage.list_threads()


@router.post("", response_model=Thread, status_code=status.HTTP_201_CREATED)
def create_thread(payload: ThreadCreate):
    return storage.create_thread(payload)


@router.patch("/{thread_id}", response_model=Thread)
def update_thread(thread_id: str, payload: ThreadUpdate):
    try:
        return storage.update_thread(thread_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Thread not found")


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(thread_id: str):
    deleted = storage.delete_thread(thread_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Thread not found")
