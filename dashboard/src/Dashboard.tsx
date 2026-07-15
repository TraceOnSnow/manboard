import { CalendarDots, Compass, Folder, Sparkle, Tray } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { api } from "./api/threads";
import { BoardSection } from "./components/BoardSection";
import { QuickCapture } from "./components/QuickCapture";
import { ThreadDrawer } from "./components/ThreadDrawer";
import { ThreadTile } from "./components/ThreadTile";
import { isInboxThread, isTodayTodo, mediaTypes, quickCaptureInput, sortByRecent, sortTodayTodos } from "./lib/threads";
import type { Thread, ThreadInput, ThreadStatus, ThreadType } from "./types/thread";

type DrawerState = { title: string; thread: Thread; isNew: boolean } | null;
type NavItem = { href: string; label: string; icon: ElementType };

const navItems: NavItem[] = [
  { href: "#today", label: "今天", icon: CalendarDots },
  { href: "#inbox", label: "Inbox", icon: Tray },
  { href: "#projects", label: "项目", icon: Folder },
  { href: "#explore", label: "更多内容", icon: Compass },
];

const createDraft = (input: ThreadInput): Thread => ({
  id: "draft",
  title: input.title ?? "",
  type: input.type,
  status: input.status ?? "active",
  priority: input.priority ?? "next",
  horizon: input.horizon ?? "none",
  area: input.area,
  nextAction: input.nextAction,
  notes: input.notes,
  lastTouched: "",
  createdAt: "",
  updatedAt: "",
});

const sectionDefaults = (type: ThreadType, horizon: Thread["horizon"] = "none"): ThreadInput => ({ title: "", type, horizon, status: "active", priority: "next" });

export default function Dashboard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setThreads(await api.listThreads()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "加载失败，请重试。"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const views = useMemo(() => ({
    todayTodos: sortTodayTodos(threads.filter(isTodayTodo)),
    todayGoals: sortByRecent(threads.filter((item) => item.horizon === "today" && !isTodayTodo(item))),
    inbox: sortByRecent(threads.filter(isInboxThread)),
    projects: sortByRecent(threads.filter((item) => item.horizon === "none" && item.type === "project")),
    backlog: sortTodayTodos(threads.filter((item) => item.horizon === "none" && item.type === "todo")),
    week: sortByRecent(threads.filter((item) => item.horizon === "week")),
    long: sortByRecent(threads.filter((item) => item.horizon === "long")),
    research: sortByRecent(threads.filter((item) => item.horizon === "none" && item.type === "research")),
    media: sortByRecent(threads.filter((item) => item.horizon === "none" && mediaTypes.has(item.type))),
    chats: sortByRecent(threads.filter((item) => item.horizon === "none" && item.type === "ai-chat")),
    entries: sortByRecent(threads.filter((item) => item.horizon === "none" && item.type === "entry")),
    growth: sortByRecent(threads.filter((item) => item.horizon === "none" && ["goal", "self-improvement"].includes(item.type))),
  }), [threads]);

  const openNew = (title: string, defaults: ThreadInput) => setDrawer({ title, thread: createDraft(defaults), isNew: true });
  const openThread = (thread: Thread) => setDrawer({ title: "条目详情", thread, isNew: false });

  const saveDrawer = async (input: ThreadInput) => {
    if (!drawer) return;
    if (drawer.isNew) await api.createThread(input);
    else await api.updateThread(drawer.thread.id, input);
    setDrawer(null);
    await load();
  };

  const deleteDrawer = async () => {
    if (!drawer || drawer.isNew) return;
    await api.deleteThread(drawer.thread.id);
    setDrawer(null);
    await load();
  };

  const updateStatus = async (thread: Thread, status: ThreadStatus) => {
    await api.updateThread(thread.id, { status });
    await load();
  };

  const renderTiles = (items: Thread[], todo = false) => <div className={todo ? "space-y-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>{items.map((thread) => <ThreadTile key={thread.id} thread={thread} todo={todo} onOpen={() => openThread(thread)} onStatus={(status) => void updateStatus(thread, status)} />)}</div>;
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return <div className="min-h-screen bg-zinc-50 text-zinc-900">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">跳到主要内容</a>
    <div className="mx-auto flex min-h-screen max-w-[1440px]">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-zinc-200 bg-white px-4 py-6 lg:block">
        <div className="mb-10 flex items-center gap-2 px-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Sparkle size={19} weight="fill" aria-hidden="true" /></span><span className="text-lg font-bold tracking-tight">manboard</span></div>
        <nav aria-label="主要分区" className="space-y-1">{navItems.map(({ href, label, icon: Icon }) => <a key={href} href={href} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"><Icon size={18} aria-hidden="true" />{label}</a>)}</nav>
        <div className="mt-auto border-t border-zinc-100 pt-5 text-xs leading-5 text-zinc-400">先捕捉，再整理。<br />这就是今天的全部计划。</div>
      </aside>
      <main id="main-content" className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <header className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-blue-600">{date}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">今天，慢一点也没关系。</h1><p className="mt-2 text-sm text-zinc-500">把眼前的小事做好，其余的交给以后。</p></div><span className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-500">{threads.length} 条记录</span></header>
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
        {loading ? <p className="py-10 text-sm text-zinc-500">正在整理你的面板…</p> : <div className="space-y-10">
          <QuickCapture onCapture={async (title) => { await api.createThread(quickCaptureInput(title)); await load(); }} />
          <section id="today" className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
            <BoardSection id="today-tasks" title="今日待办" description="五分钟的小事，勾掉就好。" items={views.todayTodos} emptyLabel="今天还没有待办。加一件能立刻开始的小事。" onAdd={() => openNew("新增今日待办", sectionDefaults("todo", "today"))} collapseCompleted={false}>{(items) => renderTiles(items, true)}</BoardSection>
            <BoardSection id="inbox" title="Inbox" description="还没想好放哪里，也完全没关系。" items={views.inbox} emptyLabel="暂时没有未整理的想法。" onAdd={() => openNew("记录一个想法", sectionDefaults("other"))}>{(items) => renderTiles(items)}</BoardSection>
          </section>
          {views.todayGoals.length > 0 && <BoardSection id="today-goals" title="今日目标" items={views.todayGoals} emptyLabel="" onAdd={() => openNew("新增今日目标", sectionDefaults("goal", "today"))}>{(items) => renderTiles(items)}</BoardSection>}
          <BoardSection id="projects" title="当前项目" description="最近碰过的排在前面；慢慢往下翻，也许会想起一些事。" items={views.projects} emptyLabel="还没有项目。从一个想做的方向开始。" onAdd={() => openNew("新增项目", sectionDefaults("project"))}>{(items) => renderTiles(items)}</BoardSection>
          <BoardSection id="backlog" title="待办" description="不一定今天做，但值得记住。" items={views.backlog} emptyLabel="待办清单是空的。" onAdd={() => openNew("新增待办", sectionDefaults("todo"))}>{(items) => renderTiles(items, true)}</BoardSection>
          <div id="explore" className="grid gap-8 xl:grid-cols-2">
            <BoardSection id="week" title="本周目标" items={views.week} emptyLabel="本周暂未安排目标。" onAdd={() => openNew("新增本周目标", sectionDefaults("goal", "week"))}>{(items) => renderTiles(items)}</BoardSection>
            <BoardSection id="long" title="长期目标" items={views.long} emptyLabel="长期目标会在这里。" onAdd={() => openNew("新增长期目标", sectionDefaults("goal", "long"))}>{(items) => renderTiles(items)}</BoardSection>
            <BoardSection id="research" title="研究方向" items={views.research} emptyLabel="下一次调研从这里开始。" onAdd={() => openNew("新增研究", sectionDefaults("research"))}>{(items) => renderTiles(items)}</BoardSection>
            <BoardSection id="media" title="正在看 / 玩" items={views.media} emptyLabel="想看的、想玩的，都可以记在这里。" onAdd={() => openNew("新增媒体记录", sectionDefaults("novel"))}>{(items) => renderTiles(items)}</BoardSection>
            <BoardSection id="chats" title="AI 对话摘要" items={views.chats} emptyLabel="值得回看的对话会在这里。" onAdd={() => openNew("新增对话摘要", sectionDefaults("ai-chat"))}>{(items) => renderTiles(items)}</BoardSection>
            <BoardSection id="entries" title="工作流入口" items={views.entries} emptyLabel="常用链接或命令可以放在这里。" onAdd={() => openNew("新增工作流入口", sectionDefaults("entry"))}>{(items) => renderTiles(items)}</BoardSection>
            <BoardSection id="growth" title="成长与其他" items={views.growth} emptyLabel="这里留给不急着归类的长期方向。" onAdd={() => openNew("新增成长记录", sectionDefaults("self-improvement"))}>{(items) => renderTiles(items)}</BoardSection>
          </div>
        </div>}
      </main>
    </div>
    {drawer && <ThreadDrawer title={drawer.title} initial={drawer.thread} onSubmit={saveDrawer} onDelete={drawer.isNew ? undefined : deleteDrawer} onClose={() => setDrawer(null)} />}
  </div>;
}
