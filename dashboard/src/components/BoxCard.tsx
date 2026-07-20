import { DotsThree, DotsSixVertical, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import type { FormEvent, PointerEventHandler } from "react";
import { sortTasksForBox } from "../lib/board";
import type { Box, Task } from "../types/board";
import { TaskRow } from "./TaskRow";

type Props = {
  box: Box;
  tasks: Task[];
  onQuickCreate: (boxId: string, title: string) => Promise<void>;
  onRenameBox: (box: Box, title: string) => Promise<void>;
  onDeleteBox: (box: Box) => void;
  onToggleComplete: (task: Task) => void;
  onRenameTask: (task: Task, title: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onStartDrag?: PointerEventHandler<HTMLButtonElement>;
  onStartResize?: PointerEventHandler<HTMLButtonElement>;
};

export function BoxCard({
  box,
  tasks,
  onQuickCreate,
  onRenameBox,
  onDeleteBox,
  onToggleComplete,
  onRenameTask,
  onEditTask,
  onStartDrag,
  onStartResize,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [boxTitle, setBoxTitle] = useState(box.title);
  const [menu, setMenu] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await onQuickCreate(box.id, title.trim());
    setTitle("");
    setAdding(false);
  };

  const saveBox = async () => {
    const next = boxTitle.trim();
    if (next && next !== box.title) await onRenameBox(box, next);
    else setBoxTitle(box.title);
    setEditing(false);
  };

  return (
    <section className="box-card relative flex h-full min-h-[180px] flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <header className="flex items-center gap-2 border-b border-zinc-100 pb-2">
        <button
          type="button"
          aria-label="拖动 Box"
          title="拖动 Box"
          onPointerDown={onStartDrag}
          className="box-drag-handle inline-flex h-10 w-10 touch-none cursor-grab items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 active:cursor-grabbing"
        >
          <DotsSixVertical size={20} />
        </button>
        {editing ? (
          <input
            autoFocus
            value={boxTitle}
            onChange={(event) => setBoxTitle(event.target.value)}
            onBlur={() => void saveBox()}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveBox();
              if (event.key === "Escape") {
                setBoxTitle(box.title);
                setEditing(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-1 text-sm font-semibold"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-zinc-800"
          >
            {box.title}
          </button>
        )}
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{tasks.length}</span>
        <button
          aria-label={`新增 ${box.title}`}
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus size={18} />
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label={`更多 ${box.title} 操作`}
            onClick={() => setMenu(!menu)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
          >
            <DotsThree size={18} />
          </button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-28 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setMenu(false);
                }}
                className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-50"
              >
                重命名
              </button>
              <button
                type="button"
                onClick={() => onDeleteBox(box)}
                className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash size={14} /> 删除
              </button>
            </div>
          )}
        </div>
      </header>
      {adding && (
        <form onSubmit={submit} className="mt-3">
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              if (!title.trim()) setAdding(false);
            }}
            placeholder="写一条待办…"
            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm"
          />
        </form>
      )}
      <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {tasks.length ? (
          sortTasksForBox(tasks).map((task) => (
            <TaskRow key={task.id} task={task} onToggleComplete={onToggleComplete} onRename={onRenameTask} onEdit={onEditTask} />
          ))
        ) : (
          <p className="px-2 py-5 text-center text-sm text-zinc-400">这里还没有待办</p>
        )}
      </div>
      <button
        type="button"
        aria-label="调整 Box 大小"
        title="调整 Box 大小"
        onPointerDown={onStartResize}
        className="box-resize-handle absolute bottom-1 right-1 inline-flex h-9 w-9 touch-none cursor-nwse-resize items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
      >
        <span aria-hidden="true" className="box-resize-grip" />
      </button>
    </section>
  );
}
