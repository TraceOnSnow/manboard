import {
  TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Thread,
  type ThreadStatus,
  type ThreadPriority,
} from "../types/thread";

interface ThreadCardProps {
  thread: Thread;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: (next: ThreadStatus) => void;
}

const statusStyle: Record<ThreadStatus, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  parked: "bg-slate-200 text-slate-600",
  done: "bg-blue-100 text-blue-700",
};

const priorityStyle: Record<ThreadPriority, string> = {
  now: "bg-red-100 text-red-700",
  next: "bg-slate-100 text-slate-700",
  later: "bg-slate-50 text-slate-500",
};

// Cycle order for the status badge click: active -> done -> paused -> parked -> active
const STATUS_CYCLE: ThreadStatus[] = ["active", "done", "paused", "parked"];

export function ThreadCard({ thread, onEdit, onDelete, onCycleStatus }: ThreadCardProps) {
  const nextStatus =
    STATUS_CYCLE[(STATUS_CYCLE.indexOf(thread.status) + 1) % STATUS_CYCLE.length];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-900">{thread.title}</h3>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
            title="编辑"
          >
            编辑
          </button>
          <button
            onClick={onDelete}
            className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
            title="删除"
          >
            删除
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
          {TYPE_LABELS[thread.type]}
        </span>
        <button
          onClick={() => onCycleStatus(nextStatus)}
          className={`rounded px-2 py-0.5 ${statusStyle[thread.status]}`}
          title="点击切换状态"
        >
          {STATUS_LABELS[thread.status]}
        </button>
        <span className={`rounded px-2 py-0.5 ${priorityStyle[thread.priority]}`}>
          {PRIORITY_LABELS[thread.priority]}
        </span>
        {thread.area && (
          <span className="rounded bg-purple-50 px-2 py-0.5 text-purple-600">
            {thread.area}
          </span>
        )}
      </div>

      {thread.nextAction && (
        <p className="mt-2 text-sm text-slate-700">
          <span className="text-slate-400">→</span> {thread.nextAction}
        </p>
      )}

      {thread.notes && (
        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{thread.notes}</p>
      )}
    </div>
  );
}
