"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";

export function Column({ column, tasks, onAdd, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex h-full min-h-0 w-[80vw] shrink-0 flex-col rounded-xl bg-kanban-col/60 sm:w-72 lg:h-auto lg:w-auto">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            {column.title}
          </h2>
          <span className="rounded-full bg-slate-700/70 px-2 py-0.5 text-xs text-slate-300">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(column.id)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-700/60 hover:text-kanban-accent"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`scroll-thin min-h-16 flex-1 space-y-2.5 overflow-y-auto rounded-lg px-2.5 pb-3 transition-colors lg:max-h-[calc(100vh-11rem)] lg:flex-none ${
          isOver ? "bg-kanban-accent/5" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onCardClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-slate-600">
            No tasks
          </p>
        ) : null}
      </div>
    </div>
  );
}
