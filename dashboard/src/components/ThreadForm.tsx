import { useEffect, useState } from "react";
import {
  THREAD_TYPES,
  THREAD_STATUSES,
  THREAD_PRIORITIES,
  TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Thread,
  type ThreadInput,
} from "../types/thread";

interface ThreadFormProps {
  initial?: Thread | null;
  onSubmit: (input: ThreadInput) => Promise<void>;
  onCancel: () => void;
}

const emptyInput: ThreadInput = {
  title: "",
  type: "todo",
  status: "active",
  priority: "next",
  area: "",
  nextAction: "",
  notes: "",
};

export function ThreadForm({ initial, onSubmit, onCancel }: ThreadFormProps) {
  const [input, setInput] = useState<ThreadInput>(emptyInput);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setInput({
        title: initial.title,
        type: initial.type,
        status: initial.status,
        priority: initial.priority,
        area: initial.area ?? "",
        nextAction: initial.nextAction ?? "",
        notes: initial.notes ?? "",
      });
    } else {
      setInput(emptyInput);
    }
  }, [initial]);

  const update = <K extends keyof ThreadInput>(key: K, value: ThreadInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.title.trim()) {
      setError("标题不能为空");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...input,
        area: input.area?.trim() || undefined,
        nextAction: input.nextAction?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelClass}>标题 *</label>
        <input
          className={fieldClass}
          value={input.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="例如：读完某本书"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass}>类型</label>
          <select
            className={fieldClass}
            value={input.type}
            onChange={(e) => update("type", e.target.value as ThreadInput["type"])}
          >
            {THREAD_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>状态</label>
          <select
            className={fieldClass}
            value={input.status}
            onChange={(e) => update("status", e.target.value as ThreadInput["status"])}
          >
            {THREAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>优先级</label>
          <select
            className={fieldClass}
            value={input.priority}
            onChange={(e) => update("priority", e.target.value as ThreadInput["priority"])}
          >
            {THREAD_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>领域 (Area)</label>
        <input
          className={fieldClass}
          value={input.area ?? ""}
          onChange={(e) => update("area", e.target.value)}
          placeholder="可选，例如：工作 / 生活"
        />
      </div>

      <div>
        <label className={labelClass}>下一步动作</label>
        <input
          className={fieldClass}
          value={input.nextAction ?? ""}
          onChange={(e) => update("nextAction", e.target.value)}
          placeholder="可选，下一个具体动作"
        />
      </div>

      <div>
        <label className={labelClass}>备注</label>
        <textarea
          className={fieldClass}
          rows={3}
          value={input.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="可选"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
