"use client";

import { useEffect, useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { Board } from "./Board";

const STORAGE_KEY = "kanban:member";

// Gates the board behind a member PIN. Once a PIN is verified, the member name
// is kept in localStorage so the session survives refreshes, and every action
// (comments, moves) is attributed to that member without asking again.
export function PinGate() {
  const [member, setMember] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore an existing session on mount (client-only; avoids an SSR mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setMember(saved);
    } catch {
      // ignore blocked/unavailable storage
    }
    setReady(true);
  }, []);

  function unlock(name) {
    setMember(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // ignore
    }
  }

  function lock() {
    setMember(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-kanban-bg text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!member) {
    return <PinScreen onUnlock={unlock} />;
  }

  return (
    <main className="flex h-screen flex-col bg-kanban-bg">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-kanban-line px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h1 className="text-base font-bold text-slate-100 sm:text-lg">
            HostelLink <span className="text-kanban-accent">Kanban</span>
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Dev team board · Backlog → Pending → QA → UAT → Done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Signed in as{" "}
            <span className="font-semibold text-slate-200">{member}</span>
          </span>
          <button
            onClick={lock}
            className="inline-flex items-center gap-1 rounded-md border border-kanban-line px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/60 hover:text-white"
            aria-label="Lock board"
            title="Lock board"
          >
            <LogOut size={13} />
            Lock
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
        <Board currentMember={member} />
      </div>
    </main>
  );
}

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (pin.length !== 4 || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Incorrect PIN.");
      }
      const { member } = await res.json();
      onUnlock(member);
    } catch (err) {
      setError(err.message);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-kanban-bg p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-2xl border border-kanban-line bg-kanban-col p-6 shadow-drag"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-kanban-accent/15 text-kanban-accent">
            <Lock size={20} />
          </div>
          <h1 className="text-base font-bold text-slate-100">
            HostelLink <span className="text-kanban-accent">Kanban</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your 4-digit PIN to continue
          </p>
        </div>

        <input
          autoFocus
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="••••"
          className="mb-3 w-full rounded-lg border border-kanban-line bg-kanban-bg py-3 text-center text-2xl tracking-[0.5em] text-slate-100 outline-none focus:border-kanban-accent"
          aria-label="PIN"
        />

        {error ? (
          <p className="mb-3 text-center text-xs text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pin.length !== 4 || busy}
          className="w-full rounded-lg bg-kanban-accent py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
