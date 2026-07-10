from fastapi import APIRouter, Depends, HTTPException, status

from .models import Thread, ThreadCreate, ThreadUpdate
from .storage import Storage, get_storage

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("", response_model=list[Thread])
def list_threads(store: Storage = Depends(get_storage)):
    return store.list()


@router.post("", response_model=Thread, status_code=status.HTTP_201_CREATED)
def create_thread(payload: ThreadCreate, store: Storage = Depends(get_storage)):
    return store.create(payload)


@router.get("/{thread_id}", response_model=Thread)
def get_thread(thread_id: str, store: Storage = Depends(get_storage)):
    try:
        return store.get(thread_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Thread not found")


@router.patch("/{thread_id}", response_model=Thread)
def update_thread(thread_id: str, payload: ThreadUpdate, store: Storage = Depends(get_storage)):
    try:
        return store.update(thread_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Thread not found")


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(thread_id: str, store: Storage = Depends(get_storage)):
    if not store.delete(thread_id):
        raise HTTPException(status_code=404, detail="Thread not found")
