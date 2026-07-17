import { PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import type { Task } from "../types/board";

type Props = { task: Task; onToggleComplete: (task: Task) => void; onRename: (task: Task, title: string) => Promise<void>; onEdit: (task: Task) => void };
export function TaskRow({ task, onToggleComplete, onRename, onEdit }: Props) {
  const [editing, setEditing] = useState(false); const [title, setTitle] = useState(task.title);
  const save = async () => { const next = title.trim(); if (next) await onRename(task, next); else setTitle(task.title); setEditing(false); };
  const completed = task.completedAt !== null;
  return <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50">
    <input aria-label={`完成“${task.title}”`} type="checkbox" checked={completed} onChange={(event)=>{event.stopPropagation();onToggleComplete(task);}} className="h-4 w-4 rounded border-zinc-300 text-blue-600" />
    {editing ? <input autoFocus value={title} onChange={(event)=>setTitle(event.target.value)} onBlur={()=>void save()} onKeyDown={(event)=>{if(event.key==="Enter"){event.preventDefault();void save();} if(event.key==="Escape"){setTitle(task.title);setEditing(false);}}} className="min-w-0 flex-1 rounded border border-blue-300 bg-white px-2 py-1 text-sm" /> : <button type="button" className={`min-w-0 flex-1 truncate text-left text-sm ${completed ? "text-zinc-400 line-through" : "text-zinc-700"}`} onClick={()=>setEditing(true)}>{task.title}</button>}
    <button type="button" aria-label={`编辑“${task.title}”`} onClick={(event)=>{event.stopPropagation();onEdit(task);}} className="invisible rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 group-hover:visible focus-visible:visible"><PencilSimple size={16}/></button>
  </div>;
}
