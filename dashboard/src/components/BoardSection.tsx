import { CaretDown, Plus } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import type { Thread } from "../types/thread";

interface BoardSectionProps {
  id: string;
  title: string;
  description?: string;
  items: Thread[];
  emptyLabel: string;
  onAdd: () => void;
  children: (items: Thread[]) => ReactNode;
  collapseCompleted?: boolean;
}

export function BoardSection({ id, title, description, items, emptyLabel, onAdd, children, collapseCompleted = true }: BoardSectionProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const activeItems = collapseCompleted ? items.filter((item) => item.status !== "done") : items;
  const completedItems = collapseCompleted ? items.filter((item) => item.status === "done") : [];

  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{title}</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">{items.length}</span>
          </div>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        <button type="button" onClick={onAdd} className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white px-2 text-sm font-medium text-zinc-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" aria-label={`新增${title}`}>
          <Plus size={18} weight="bold" aria-hidden="true" />
          <span className="hidden sm:inline">新增</span>
        </button>
      </div>
      {activeItems.length ? children(activeItems) : <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-5 text-sm text-zinc-400">{emptyLabel}</p>}
      {completedItems.length > 0 && (
        <div className="mt-2 rounded-xl border border-zinc-200 bg-white">
          <button type="button" onClick={() => setShowCompleted((visible) => !visible)} className="flex min-h-11 w-full items-center justify-between px-3 text-sm font-medium text-zinc-500" aria-expanded={showCompleted}>
            已完成（{completedItems.length}）
            <CaretDown size={16} className={`transition-transform ${showCompleted ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {showCompleted && <div className="border-t border-zinc-100 p-2">{children(completedItems)}</div>}
        </div>
      )}
    </section>
  );
}
