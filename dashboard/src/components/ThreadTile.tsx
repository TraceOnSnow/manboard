import { CaretDown, Check, PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS, type Thread, type ThreadStatus } from "../types/thread";

interface ThreadTileProps {
  thread: Thread;
  todo?: boolean;
  onOpen: () => void;
  onStatus: (status: ThreadStatus) => void;
}

const statusClass: Record<ThreadStatus, string> = { active: "bg-emerald-50 text-emerald-700", paused: "bg-amber-50 text-amber-700", parked: "bg-zinc-100 text-zinc-600", done: "bg-blue-50 text-blue-700" };
const statusOrder: ThreadStatus[] = ["active", "paused", "parked", "done"];

export function ThreadTile({ thread, todo = false, onOpen, onStatus }: ThreadTileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDone = thread.status === "done";

  if (todo) return <div className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 transition ${isDone ? "border-zinc-100 bg-zinc-50 text-zinc-400" : "border-zinc-200 bg-white text-zinc-900"}`}>
    <button type="button" onClick={() => onStatus(isDone ? "active" : "done")} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${isDone ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 bg-white text-transparent hover:border-blue-500"}`} aria-label={isDone ? `标记“${thread.title}”为未完成` : `完成“${thread.title}”`}><Check size={19} weight="bold" aria-hidden="true" /></button>
    <button type="button" onClick={onOpen} className={`min-w-0 flex-1 text-left text-sm font-medium ${isDone ? "line-through" : ""}`}>{thread.title}</button>
    <span className="hidden rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 sm:inline">{PRIORITY_LABELS[thread.priority]}</span>
  </div>;

  return <article className="group rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 hover:shadow-sm">
    <div className="flex items-start gap-2"><button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left"><h3 className="font-semibold leading-5 text-zinc-900">{thread.title}</h3>{thread.nextAction && <p className="mt-1 truncate text-sm text-zinc-500">下一步：{thread.nextAction}</p>}</button><button type="button" onClick={onOpen} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label={`编辑“${thread.title}”`}><PencilSimple size={17} aria-hidden="true" /></button></div>
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs"><span className="rounded-lg bg-zinc-100 px-2 py-1 font-medium text-zinc-600">{TYPE_LABELS[thread.type]}</span><div className="relative"><button type="button" onClick={() => setMenuOpen((open) => !open)} className={`inline-flex min-h-7 items-center gap-1 rounded-lg px-2 py-1 font-medium ${statusClass[thread.status]}`} aria-haspopup="menu" aria-expanded={menuOpen}>{STATUS_LABELS[thread.status]}<CaretDown size={12} aria-hidden="true" /></button>{menuOpen && <div role="menu" className="absolute left-0 top-8 z-10 w-28 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">{statusOrder.map((status) => <button key={status} type="button" role="menuitem" onClick={() => { onStatus(status); setMenuOpen(false); }} className="flex min-h-9 w-full items-center rounded-lg px-2 text-left text-xs text-zinc-700 hover:bg-zinc-100">{STATUS_LABELS[status]}</button>)}</div>}</div><span className="rounded-lg bg-blue-50 px-2 py-1 font-medium text-blue-700">{PRIORITY_LABELS[thread.priority]}</span>{thread.area && <span className="rounded-lg bg-violet-50 px-2 py-1 font-medium text-violet-700">{thread.area}</span>}</div>
  </article>;
}
