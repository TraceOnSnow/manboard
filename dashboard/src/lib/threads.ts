import type { Thread, ThreadInput, ThreadPriority } from "../types/thread";

export const priorityRank: Record<ThreadPriority, number> = {
  now: 0,
  next: 1,
  later: 2,
};

export const mediaTypes = new Set<Thread["type"]>(["game", "novel", "anime", "video"]);

export function isInboxThread(thread: Thread) {
  return thread.type === "other" && thread.horizon === "none";
}

export function isTodayTodo(thread: Thread) {
  return thread.type === "todo" && thread.horizon === "today";
}

export function sortByRecent(threads: Thread[]) {
  return [...threads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function sortTodayTodos(threads: Thread[]) {
  return [...threads].sort((a, b) => {
    const statusRank = Number(a.status === "done") - Number(b.status === "done");
    if (statusRank !== 0) return statusRank;
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}

export function quickCaptureInput(title: string): ThreadInput {
  return {
    title: title.trim(),
    type: "other",
    status: "active",
    priority: "next",
    horizon: "none",
  };
}
