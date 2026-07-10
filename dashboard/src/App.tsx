import { useEffect, useMemo, useState } from "react";
import { api } from "./api/threads";
import { ThreadForm } from "./components/ThreadForm";
import { ThreadCard } from "./components/ThreadCard";
import {
  type Thread,
  type ThreadInput,
  type ThreadStatus,
  type ThreadPriority,
  type ThreadType,
} from "./types/thread";

const priorityRank: Record<ThreadPriority, number> = { now: 0, next: 1, later: 2 };

const MEDIA_TYPES: ThreadType[] = ["game", "novel", "anime", "video"];

interface Section {
  key: string;
  label: string;
  filter: (t: Thread) => boolean;
}

const SECTIONS: Section[] = [
  { key: "today", label: "今日目标", filter: (t) => t.horizon === "today" },
  { key: "week", label: "本周目标", filter: (t) => t.horizon === "week" },
  { key: "long", label: "长期目标", filter: (t) => t.horizon === "long" },
  {
    key: "project",
    label: "当前项目",
    filter: (t) => t.horizon === "none" && t.type === "project",
  },
  {
    key: "todo",
    label: "待办",
    filter: (t) => t.horizon === "none" && t.type === "todo",
  },
  {
    key: "ai-chat",
    label: "AI 对话摘要",
    filter: (t) => t.horizon === "none" && t.type === "ai-chat",
  },
  {
    key: "research",
    label: "研究方向",
    filter: (t) => t.horizon === "none" && t.type === "research",
  },
  {
    key: "media",
    label: "正在玩 / 看",
    filter: (t) => t.horizon === "none" && MEDIA_TYPES.includes(t.type),
  },
  {
    key: "entry",
    label: "工作流入口",
    filter: (t) => t.horizon === "none" && t.type === "entry",
  },
];

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const sections = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        items: threads
          .filter(s.filter)
          .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]),
      })),
    [threads]
  );

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
    if (!confirm("确认删除这条记录？")) return;
    await api.deleteThread(id);
    await load();
  };

  const handleCycleStatus = async (thread: Thread, next: ThreadStatus) => {
    await api.updateThread(thread.id, { status: next });
    await load();
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">manboard</h1>
            <p className="text-sm text-slate-500">个人中枢 · {threads.length} 条记录</p>
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

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">加载中…</p>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.key}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {section.label}
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                    {section.items.length}
                  </span>
                </h2>
                {section.items.length === 0 ? (
                  <div className="rounded border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-400">
                    空
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {section.items.map((t) => (
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
              </section>
            ))}
          </div>
        )}
      </div>

      {(showForm || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              {editing ? "编辑" : "新增"}
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
