from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import boxes_router, tasks_router

app = FastAPI(title="Life Dashboard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(boxes_router)
app.include_router(tasks_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
