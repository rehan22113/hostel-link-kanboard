"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Send, User } from "lucide-react";
import { MEMBERS } from "@/config/members";
import { timeAgo } from "@/lib/date";

const empty = { title: "", description: "", assignee: "", deadline: "" };

export function TaskModal({
  mode,
  initial,
  onSave,
  onDelete,
  onAddComment,
  onDeleteComment,
  onClose,
}) {
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-kanban-line bg-kanban-col p-5 shadow-drag"
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

        {mode === "edit" && initial ? (
          <Comments
            comments={initial.comments || []}
            onAdd={(payload) => onAddComment(initial.id, payload)}
            onDelete={(commentId) => onDeleteComment(initial.id, commentId)}
          />
        ) : null}
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

function Comments({ comments, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState(MEMBERS[0] || "");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || !author || busy) return;
    setBusy(true);
    const ok = await onAdd({ author, text: text.trim() });
    setBusy(false);
    if (ok) setText("");
  }

  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  return (
    <div className="mt-5 border-t border-kanban-line pt-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Comments{comments.length ? ` (${comments.length})` : ""}
      </h3>

      <div className="mb-3 space-y-2.5">
        {sorted.length === 0 ? (
          <p className="text-xs text-slate-600">No comments yet.</p>
        ) : (
          sorted.map((c) => (
            <div
              key={c.id}
              className="group rounded-lg border border-kanban-line bg-kanban-bg/60 p-2.5"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200">
                  <User size={11} />
                  {c.author}
                  <span className="ml-1 font-normal text-slate-500">
                    · {timeAgo(c.createdAt)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="text-slate-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete comment"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                {c.text}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Reply as</span>
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="input !w-auto !py-1 text-xs"
          >
            {MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
            }}
            placeholder="Write a comment… (Ctrl+Enter to send)"
            rows={2}
            className="input resize-none"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="mb-0.5 rounded-md bg-kanban-accent p-2 text-white hover:bg-orange-600 disabled:opacity-50"
            aria-label="Send comment"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
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
