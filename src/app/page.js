import { Board } from "@/components/Board";

export default function Page() {
  return (
    <main className="flex h-screen flex-col bg-kanban-bg">
      <header className="flex items-center justify-between border-b border-kanban-line px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-100">
            HostelLink <span className="text-kanban-accent">Kanban</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dev team board · Backlog → Pending → QA → UAT → Done
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <Board />
      </div>
    </main>
  );
}
