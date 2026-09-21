"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { COLUMNS, COLUMN_IDS } from "@/config/columns";
import { Column } from "./Column";
import { TaskCardView } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { SummaryModal } from "./SummaryModal";
import { Toast } from "./Toast";

export function Board({ currentMember, summaryOpen, onCloseSummary }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [modal, setModal] = useState(null); // { mode, initial?, defaultStatus? }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to load tasks");
        setTasks(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // tasks grouped by column, each sorted by order
  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMN_IDS.map((id) => [id, []]));
    for (const t of tasks) {
      if (map[t.status]) map[t.status].push(t);
    }
    for (const id of COLUMN_IDS) {
      map[id].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [tasks]);

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : null;

  // ---- Modal + deep-linking (?task=<id>) -----------------------------------

  function openTask(task) {
    setModal({ mode: "edit", initial: task });
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `?task=${task.id}`);
    }
  }

  function openCreate(status) {
    setModal({ mode: "create", defaultStatus: status });
  }

  function closeModal() {
    setModal(null);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.pushState({}, "", window.location.pathname);
    }
  }

  // Open the task named in the URL once tasks have loaded (shared link support).
  const [deepLinked, setDeepLinked] = useState(false);
  useEffect(() => {
    if (loading || deepLinked) return;
    const id = new URLSearchParams(window.location.search).get("task");
    if (id) {
      const t = tasks.find((x) => x.id === id);
      if (t) setModal({ mode: "edit", initial: t });
      else setError("That task link wasn't found — it may have been deleted.");
    }
    setDeepLinked(true);
  }, [loading, deepLinked, tasks]);

  // Keep the modal in sync with browser back/forward.
  useEffect(() => {
    function onPop() {
      const id = new URLSearchParams(window.location.search).get("task");
      const t = id ? tasks.find((x) => x.id === id) : null;
      setModal(t ? { mode: "edit", initial: t } : null);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [tasks]);

  // ---- CRUD ----------------------------------------------------------------

  async function createTask(payload) {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          status: modal.defaultStatus,
          by: currentMember,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Create failed");
      const created = await res.json();
      setTasks((prev) => [...prev, created]);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function updateTask(id, patch) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function deleteTask(id) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  // Replace a task everywhere it's held (list + the open modal, if it's this task).
  function syncTask(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setModal((m) =>
      m && m.initial && m.initial.id === updated.id
        ? { ...m, initial: updated }
        : m
    );
  }

  async function addComment(id, payload) {
    try {
      const res = await fetch(`/api/tasks/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Comment failed");
      syncTask(await res.json());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function deleteComment(id, commentId) {
    try {
      const res = await fetch(`/api/tasks/${id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Delete comment failed");
      syncTask(await res.json());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  // ---- Drag & drop ---------------------------------------------------------

  function findColumnOf(id) {
    if (COLUMN_IDS.includes(id)) return id; // dropped on empty column
    const task = tasks.find((t) => t.id === id);
    return task ? task.status : null;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeCol = findColumnOf(active.id);
    const overCol = findColumnOf(over.id);
    if (!activeCol || !overCol) return;

    // Build the target column's ordered id list after the move.
    const activeItems = grouped[activeCol].map((t) => t.id);
    const overItems = grouped[overCol].map((t) => t.id);

    const oldIndex = activeItems.indexOf(active.id);
    let newIndex;
    if (activeCol === overCol) {
      newIndex = overItems.indexOf(over.id);
      if (newIndex === -1) newIndex = overItems.length - 1;
      if (oldIndex === newIndex) return;
    } else {
      const overIdx = overItems.indexOf(over.id);
      newIndex = overIdx === -1 ? overItems.length : overIdx;
    }

    // Compute the new ordering for the target column.
    let targetIds;
    if (activeCol === overCol) {
      targetIds = arrayMove(overItems, oldIndex, newIndex);
    } else {
      targetIds = [...overItems];
      targetIds.splice(newIndex, 0, active.id);
    }

    const prevTasks = tasks; // snapshot for rollback

    // Optimistic local update: set status on the moved card and reindex column.
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === active.id) {
          return { ...t, status: overCol, order: targetIds.indexOf(t.id) };
        }
        if (t.status === overCol) {
          const idx = targetIds.indexOf(t.id);
          if (idx !== -1) return { ...t, order: idx };
        }
        return t;
      })
    );

    // Persist: the moved card (status + order) plus any card whose order changed.
    persistColumn(overCol, targetIds, active.id, prevTasks);
  }

  async function persistColumn(colId, orderedIds, movedId, prevTasks) {
    try {
      const saved = await Promise.all(
        orderedIds.map((id, index) => {
          const patch = { order: index };
          // The moved card also gets its new column; `by` lets the server
          // attribute the move in the card's history (ignored if the status
          // is unchanged, e.g. a same-column reorder).
          if (id === movedId) {
            patch.status = colId;
            patch.by = currentMember;
          }
          return fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }).then(async (r) => {
            if (!r.ok) throw new Error("Move failed to save");
            return r.json();
          });
        })
      );
      // Reconcile the moved card with the server's response so its freshly
      // appended history entry shows up locally (and in an open modal).
      const moved = saved.find((d) => d && d.id === movedId);
      if (moved) syncTask(moved);
    } catch (e) {
      setError(e.message + " — reverting");
      setTasks(prevTasks); // rollback to pre-drag state
    }
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="scroll-thin flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-1 lg:grid lg:grid-cols-3 lg:items-start lg:overflow-visible lg:pb-0 xl:grid-cols-5">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={grouped[col.id]}
              onAdd={openCreate}
              onCardClick={openTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2">
              <TaskCardView task={activeTask} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {loading ? (
        <p className="pt-6 text-center text-sm text-slate-500">Loading…</p>
      ) : null}

      {modal ? (
        <TaskModal
          mode={modal.mode}
          initial={modal.initial}
          onSave={(payload) =>
            modal.mode === "edit"
              ? updateTask(modal.initial.id, payload)
              : createTask(payload)
          }
          onDelete={deleteTask}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          onClose={closeModal}
          currentMember={currentMember}
        />
      ) : null}

      {summaryOpen ? (
        <SummaryModal tasks={tasks} onClose={onCloseSummary} />
      ) : null}

      <Toast message={error} onClose={() => setError("")} />
    </div>
  );
}
