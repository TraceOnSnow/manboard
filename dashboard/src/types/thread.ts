export type ThreadType =
  | "goal"
  | "project"
  | "research"
  | "todo"
  | "game"
  | "novel"
  | "anime"
  | "video"
  | "ai-chat"
  | "self-improvement"
  | "entry"
  | "other";

export type ThreadStatus = "active" | "paused" | "parked" | "done";

export type ThreadPriority = "now" | "next" | "later";

export type ThreadHorizon = "today" | "week" | "long" | "none";

export interface Thread {
  id: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  priority: ThreadPriority;
  horizon: ThreadHorizon;
  area?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  lastTouched: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadInput {
  title: string;
  type: ThreadType;
  status?: ThreadStatus;
  priority?: ThreadPriority;
  horizon?: ThreadHorizon;
  area?: string;
  nextAction?: string;
  notes?: string;
}

export type ThreadPatch = Partial<ThreadInput>;

export const THREAD_TYPES: ThreadType[] = [
  "goal",
  "project",
  "research",
  "todo",
  "game",
  "novel",
  "anime",
  "video",
  "ai-chat",
  "self-improvement",
  "entry",
  "other",
];

export const THREAD_STATUSES: ThreadStatus[] = ["active", "paused", "parked", "done"];

export const THREAD_PRIORITIES: ThreadPriority[] = ["now", "next", "later"];

export const THREAD_HORIZONS: ThreadHorizon[] = ["today", "week", "long", "none"];

export const TYPE_LABELS: Record<ThreadType, string> = {
  goal: "长期目标",
  project: "项目",
  research: "研究",
  todo: "待办",
  game: "游戏",
  novel: "小说",
  anime: "番剧",
  video: "视频",
  "ai-chat": "AI 对话",
  "self-improvement": "自我提升",
  entry: "工作流入口",
  other: "其他",
};

export const STATUS_LABELS: Record<ThreadStatus, string> = {
  active: "进行中",
  paused: "暂停",
  parked: "搁置",
  done: "完成",
};

export const PRIORITY_LABELS: Record<ThreadPriority, string> = {
  now: "现在",
  next: "下一步",
  later: "稍后",
};

export const HORIZON_LABELS: Record<ThreadHorizon, string> = {
  today: "今日",
  week: "本周",
  long: "长期",
  none: "无",
};
