"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Send, User, Link2, Check, ArrowRight } from "lucide-react";
import { MEMBERS } from "@/config/members";
import { COLUMNS } from "@/config/columns";
import { timeAgo } from "@/lib/date";

// Column id → human title, for rendering move history ("Backlog → Pending").
const COLUMN_TITLE = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]));
const titleFor = (id) => COLUMN_TITLE[id] || id;

const empty = { title: "", description: "", assignee: "", deadline: "" };

// Distinct comment colors per member so each person's replies are easy to tell apart.
const COMMENT_COLORS = [
  { bg: "bg-indigo-500/10", border: "border-indigo-500/40", name: "text-indigo-300" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/40", name: "text-emerald-300" },
  { bg: "bg-pink-500/10", border: "border-pink-500/40", name: "text-pink-300" },
  { bg: "bg-amber-500/10", border: "border-amber-500/40", name: "text-amber-300" },
  { bg: "bg-sky-500/10", border: "border-sky-500/40", name: "text-sky-300" },
  { bg: "bg-violet-500/10", border: "border-violet-500/40", name: "text-violet-300" },
];
const NEUTRAL_COLOR = {
  bg: "bg-kanban-bg/60",
  border: "border-kanban-line",
  name: "text-slate-200",
};

function colorForAuthor(author) {
  const idx = MEMBERS.indexOf(author);
  if (idx >= 0) return COMMENT_COLORS[idx % COMMENT_COLORS.length];
  if (!author) return NEUTRAL_COLOR;
  // Deterministic fallback for authors not in the member list.
  let hash = 0;
  for (let i = 0; i < author.length; i++) hash = (hash * 31 + author.charCodeAt(i)) >>> 0;
  return COMMENT_COLORS[hash % COMMENT_COLORS.length];
}

export function TaskModal({
  mode,
  initial,
  onSave,
  onDelete,
  onAddComment,
  onDeleteComment,
  onClose,
  currentMember,
}) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      const url = `${window.location.origin}${window.location.pathname}?task=${initial.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (e.g. non-HTTPS) — the URL bar already reflects the task
    }
  }

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
          <div className="flex items-center gap-1">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-700/60 hover:text-white"
                aria-label="Copy task link"
                title="Copy link to this task"
              >
                {copied ? <Check size={14} /> : <Link2 size={14} />}
                {copied ? "Copied" : "Copy link"}
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
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
          <>
            <Comments
              comments={initial.comments || []}
              currentMember={currentMember}
              onAdd={(payload) => onAddComment(initial.id, payload)}
              onDelete={(commentId) => onDeleteComment(initial.id, commentId)}
            />
            <History history={initial.history || []} />
          </>
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

function Comments({ comments, currentMember, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || !currentMember || busy) return;
    setBusy(true);
    const ok = await onAdd({ author: currentMember, text: text.trim() });
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
          sorted.map((c) => {
            const color = colorForAuthor(c.author);
            return (
            <div
              key={c.id}
              className={`group rounded-lg border p-2.5 ${color.bg} ${color.border}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${color.name}`}>
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
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="space-y-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <User size={11} />
          Commenting as{" "}
          <span className="font-semibold text-slate-300">{currentMember}</span>
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

function History({ history }) {
  // Newest move first.
  const entries = [...(history || [])].slice().reverse();

  return (
    <div className="mt-5 border-t border-kanban-line pt-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Activity{entries.length ? ` (${entries.length})` : ""}
      </h3>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-600">No moves yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs leading-relaxed text-slate-300"
            >
              <ArrowRight
                size={13}
                className="mt-0.5 shrink-0 text-slate-500"
              />
              <span>
                {h.from ? (
                  <>
                    <span className="text-slate-400">{titleFor(h.from)}</span>
                    {" → "}
                    <span className="font-medium text-slate-200">
                      {titleFor(h.to)}
                    </span>
                  </>
                ) : (
                  <>
                    Created in{" "}
                    <span className="font-medium text-slate-200">
                      {titleFor(h.to)}
                    </span>
                  </>
                )}
                <span className="text-slate-500">
                  {" · "}
                  {timeAgo(h.at)}
                  {h.by ? ` · by ${h.by}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
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
