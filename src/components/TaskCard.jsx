"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, User } from "lucide-react";
import { isOverdue, formatDeadline, effectiveDeadline } from "@/lib/date";

// Presentational card — no drag hooks. Reused by the drag overlay.
export function TaskCardView({ task, dragging }) {
  // After an extension, the task works toward nextDeadline; the original
  // deadline stays on record but no longer drives the overdue state.
  const effective = effectiveDeadline(task.deadline, task.nextDeadline);
  const overdue = task.status !== "uat" && isOverdue(effective);
  const extended = Boolean(task.nextDeadline && task.deadline);

  return (
    <div
      className={`rounded-lg border border-kanban-line bg-kanban-card p-3 transition-colors hover:border-kanban-accent/60 ${
        dragging ? "shadow-drag" : "shadow-card"
      }`}
    >
      <h3 className="mb-1 text-sm font-semibold leading-snug text-slate-100">
        {task.title}
      </h3>

      {task.description ? (
        <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
          {task.description}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {task.assignee ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-200">
            <User size={11} />
            {task.assignee}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">Unassigned</span>
        )}

        {task.deadline ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              overdue ? "text-red-400" : "text-slate-400"
            }`}
          >
            <CalendarClock size={11} />
            {extended ? (
              <>
                <span className="text-slate-600 line-through">
                  {formatDeadline(task.deadline)}
                </span>
                <span className="text-slate-500">→</span>
                {formatDeadline(task.nextDeadline)}
              </>
            ) : (
              formatDeadline(task.deadline)
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// Sortable, clickable card used inside a column.
export function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <TaskCardView task={task} />
    </div>
  );
}
