export type TaskPriority = "high" | "medium" | "low";

export type BoxLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Box = {
  id: string;
  title: string;
  layout: BoxLayout;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  boxId: string;
  tags: string[];
  priority: TaskPriority | null;
  dueDate: string | null;
  details: string | null;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type BoxCreate = Pick<Box, "title" | "layout">;
export type BoxUpdate = Partial<BoxCreate>;
export type TaskCreate = Pick<Task, "title" | "boxId"> &
  Partial<Pick<Task, "tags" | "priority" | "dueDate" | "details">>;
export type TaskUpdate = {
  title?: string;
  boxId?: string;
  tags?: string[];
  priority?: TaskPriority | null;
  dueDate?: string | null;
  details?: string | null;
  completedAt?: string | null;
};
export type BoxDelete =
  | { taskDisposition: "delete" }
  | { taskDisposition: "move"; targetBoxId: string };

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};
