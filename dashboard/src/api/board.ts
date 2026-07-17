import type { Box, BoxCreate, BoxDelete, BoxUpdate, Task, TaskCreate, TaskUpdate } from "../types/board";

const BASE_URL = "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText} ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  listBoxes: () => request<Box[]>("/boxes"),
  createBox: (input: BoxCreate) => request<Box>("/boxes", { method: "POST", body: JSON.stringify(input) }),
  updateBox: (id: string, input: BoxUpdate) =>
    request<Box>(`/boxes/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteBox: (id: string, input: BoxDelete) =>
    request<void>(`/boxes/${id}`, { method: "DELETE", body: JSON.stringify(input) }),
  listTasks: () => request<Task[]>("/tasks"),
  createTask: (input: TaskCreate) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(input) }),
  updateTask: (id: string, input: TaskUpdate) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
