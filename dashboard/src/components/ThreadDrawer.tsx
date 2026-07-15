import { X } from "@phosphor-icons/react";
import { useEffect } from "react";
import { ThreadForm } from "./ThreadForm";
import type { Thread, ThreadInput } from "../types/thread";

interface ThreadDrawerProps {
  title: string;
  initial?: Thread | null;
  onSubmit: (input: ThreadInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function ThreadDrawer({ title, initial, onSubmit, onDelete, onClose }: ThreadDrawerProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleDelete = async () => {
    if (!onDelete || !window.confirm("确认删除这条记录？")) return;
    await onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button className="absolute inset-0 cursor-default bg-zinc-950/20" onClick={onClose} aria-label="关闭详情抽屉" />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-600">manboard</p><h2 className="mt-1 text-lg font-bold text-zinc-900">{title}</h2></div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" aria-label="关闭详情"><X size={22} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 px-5 py-5 sm:px-6"><ThreadForm initial={initial} onSubmit={onSubmit} onCancel={onClose} /></div>
        {initial && onDelete && <div className="border-t border-zinc-200 px-5 py-4 sm:px-6"><button type="button" onClick={handleDelete} className="min-h-11 text-sm font-medium text-red-600 transition hover:text-red-700">删除这条记录</button></div>}
      </aside>
    </div>
  );
}
