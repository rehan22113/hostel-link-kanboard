"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { MEMBERS } from "@/config/members";
import { COLUMNS } from "@/config/columns";

// A per-member breakdown of the board: total assigned tasks and how many sit in
// each column. Includes an "Unassigned" bucket and an "All" totals row.
export function SummaryModal({ tasks, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { rows, totals } = useMemo(() => {
    const names = [...MEMBERS, "Unassigned"];
    const emptyCols = () => Object.fromEntries(COLUMNS.map((c) => [c.id, 0]));
    const byName = Object.fromEntries(
      names.map((n) => [n, { total: 0, cols: emptyCols() }])
    );
    const totals = { total: 0, cols: emptyCols() };

    for (const t of tasks) {
      const key = MEMBERS.includes(t.assignee) ? t.assignee : "Unassigned";
      const rec = byName[key];
      rec.total += 1;
      if (rec.cols[t.status] !== undefined) rec.cols[t.status] += 1;
      totals.total += 1;
      if (totals.cols[t.status] !== undefined) totals.cols[t.status] += 1;
    }

    return { rows: names.map((n) => ({ name: n, ...byName[n] })), totals };
  }, [tasks]);

  const cell = (n) =>
    n ? (
      <span className="text-slate-200">{n}</span>
    ) : (
      <span className="text-slate-600">0</span>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-kanban-line bg-kanban-col shadow-drag"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-kanban-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Team summary
            </h2>
            <p className="text-xs text-slate-500">
              {totals.total} task{totals.total === 1 ? "" : "s"} across{" "}
              {MEMBERS.length} members
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scroll-thin overflow-auto p-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="sticky left-0 z-10 bg-kanban-col px-2 py-2 text-left">
                  Member
                </th>
                <th className="px-2 py-2 text-center">Total</th>
                {COLUMNS.map((c) => (
                  <th key={c.id} className="px-2 py-2 text-center">
                    {c.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className={`border-t border-kanban-line ${
                    r.name === "Unassigned" ? "text-slate-400" : "text-slate-200"
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-kanban-col px-2 py-2 text-left font-medium">
                    {r.name}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-kanban-accent">
                    {r.total}
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.id} className="px-2 py-2 text-center">
                      {cell(r.cols[c.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-kanban-line text-slate-100">
                <td className="sticky left-0 z-10 bg-kanban-col px-2 py-2 text-left font-semibold">
                  All
                </td>
                <td className="px-2 py-2 text-center font-bold text-kanban-accent">
                  {totals.total}
                </td>
                {COLUMNS.map((c) => (
                  <td
                    key={c.id}
                    className="px-2 py-2 text-center font-semibold"
                  >
                    {totals.cols[c.id]}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
