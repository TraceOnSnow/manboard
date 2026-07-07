import { useEffect, useMemo, useState } from "react";
import { api } from "./api/threads";
import { ThreadForm } from "./components/ThreadForm";
import { ThreadCard } from "./components/ThreadCard";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Thread,
  type ThreadInput,
  type ThreadStatus,
  type ThreadType,
  type ThreadPriority,
} from "./types/thread";

type StatusFilter = "all" | ThreadStatus;
type PriorityFilter = "all" | ThreadPriority;
type TypeFilter = "all" | ThreadType;

const priorityRank: Record<ThreadPriority, number> = { now: 0, next: 1, later: 2 };

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Thread | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setThreads(await api.listThreads());
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return threads
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  }, [threads, statusFilter, priorityFilter, typeFilter]);

  const handleCreate = async (input: ThreadInput) => {
    await api.createThread(input);
    setShowForm(false);
    await load();
  };

  const handleUpdate = async (input: ThreadInput) => {
    if (!editing) return;
    await api.updateThread(editing.id, input);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除这条 Thread？")) return;
    await api.deleteThread(id);
    await load();
  };

  const handleCycleStatus = async (thread: Thread, next: ThreadStatus) => {
    await api.updateThread(thread.id, { status: next });
    await load();
  };

  const selectClass =
    "rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Life Dashboard</h1>
            <p className="text-sm text-slate-500">个人状态面板 · {threads.length} 条 Thread</p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + 新增
          </button>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            className={selectClass}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
          >
            <option value="all">全部优先级</option>
            {(Object.keys(PRIORITY_LABELS) as ThreadPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">全部状态</option>
            {(Object.keys(STATUS_LABELS) as ThreadStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="all">全部类型</option>
            {(Object.keys(TYPE_LABELS) as ThreadType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {(statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setTypeFilter("all");
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              清除筛选
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">加载中…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
            {threads.length === 0 ? "还没有 Thread，点击右上角「新增」开始。" : "当前筛选下没有 Thread。"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                onEdit={() => {
                  setEditing(t);
                  setShowForm(false);
                }}
                onDelete={() => handleDelete(t.id)}
                onCycleStatus={(next) => handleCycleStatus(t, next)}
              />
            ))}
          </div>
        )}
      </div>

      {(showForm || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              {editing ? "编辑 Thread" : "新增 Thread"}
            </h2>
            <ThreadForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
