from fastapi import APIRouter, Depends, HTTPException, status

from .models import Box, BoxCreate, BoxDelete, BoxUpdate, Task, TaskCreate, TaskUpdate
from .storage import Storage, get_storage

boxes_router = APIRouter(prefix="/boxes", tags=["boxes"])
tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])


@boxes_router.get("", response_model=list[Box])
async def list_boxes(store: Storage = Depends(get_storage)):
    return store.list_boxes()


@boxes_router.post("", response_model=Box, status_code=status.HTTP_201_CREATED)
async def create_box(payload: BoxCreate, store: Storage = Depends(get_storage)):
    return store.create_box(payload)


@boxes_router.patch("/{box_id}", response_model=Box)
async def update_box(box_id: str, payload: BoxUpdate, store: Storage = Depends(get_storage)):
    try:
        return store.update_box(box_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Box not found")


@boxes_router.delete("/{box_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_box(box_id: str, payload: BoxDelete, store: Storage = Depends(get_storage)):
    try:
        store.delete_box(box_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Box not found")
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))


@tasks_router.get("", response_model=list[Task])
async def list_tasks(store: Storage = Depends(get_storage)):
    return store.list_tasks()


@tasks_router.post("", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, store: Storage = Depends(get_storage)):
    try:
        return store.create_task(payload)
    except (KeyError, ValueError):
        raise HTTPException(status_code=404, detail="Box not found")


@tasks_router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str, store: Storage = Depends(get_storage)):
    try:
        return store.get_task(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")


@tasks_router.patch("/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate, store: Storage = Depends(get_storage)):
    try:
        return store.update_task(task_id, payload)
    except ValueError:
        raise HTTPException(status_code=404, detail="Box not found")
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")


@tasks_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, store: Storage = Depends(get_storage)):
    if not store.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Task not found")
