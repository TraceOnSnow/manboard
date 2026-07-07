import type { Thread, ThreadInput, ThreadPatch } from "../types/thread";

const BASE_URL = "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  listThreads: () => request<Thread[]>("/threads"),
  createThread: (input: ThreadInput) =>
    request<Thread>("/threads", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateThread: (id: string, patch: ThreadPatch) =>
    request<Thread>(`/threads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteThread: (id: string) =>
    request<void>(`/threads/${id}`, { method: "DELETE" }),
};
