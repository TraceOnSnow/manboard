import { ArrowUpRight, Lightbulb, SpinnerGap } from "@phosphor-icons/react";
import { useState } from "react";

interface QuickCaptureProps {
  onCapture: (title: string) => Promise<void>;
}

export function QuickCapture({ onCapture }: QuickCaptureProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("先写下一条想法或待办。");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCapture(title);
      setTitle("");
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "记录失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="capture-heading" className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Lightbulb size={18} weight="bold" aria-hidden="true" />
        </span>
        <div>
          <h2 id="capture-heading">快速记录</h2>
          <p className="text-xs font-normal text-zinc-500">先记下来，归类以后再说。</p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="quick-capture">记录一个想法、项目或待办</label>
        <input id="quick-capture" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="想到什么，先记下来…" className="min-h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none" />
        <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? <SpinnerGap size={18} className="animate-spin" aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
          记下
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </section>
  );
}
