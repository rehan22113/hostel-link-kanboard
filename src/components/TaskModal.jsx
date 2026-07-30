"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { MEMBERS } from "@/config/members";

const empty = { title: "", description: "", assignee: "", deadline: "" };

export function TaskModal({ mode, initial, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initial) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        assignee: initial.assignee || "",
        deadline: initial.deadline ? initial.deadline.slice(0, 10) : "",
      });
    } else {
      setForm(empty);
    }
  }, [mode, initial]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    const ok = await onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      assignee: form.assignee,
      deadline: form.deadline || null,
    });
    setSaving(false);
    if (ok) onClose();
  }

  async function handleDelete() {
    if (saving) return;
    setSaving(true);
    const ok = await onDelete(initial.id);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-kanban-line bg-kanban-col p-5 shadow-drag"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">
            {mode === "edit" ? "Edit task" : "New task"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Title">
            <input
              autoFocus
              value={form.title}
              onChange={set("title")}
              placeholder="Short task title"
              className="input"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="A short description…"
              rows={3}
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Assignee">
              <select
                value={form.assignee}
                onChange={set("assignee")}
                className="input"
              >
                <option value="">Unassigned</option>
                {MEMBERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Deadline">
              <input
                type="date"
                value={form.deadline}
                onChange={set("deadline")}
                className="input"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between pt-2">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={15} />
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="rounded-md bg-kanban-accent px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #334155;
          background: #0f172a;
          padding: 0.5rem 0.65rem;
          font-size: 0.875rem;
          color: #e2e8f0;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #f97316;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
