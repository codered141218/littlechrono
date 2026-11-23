"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookView } from "@/components/BookView";
import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/Landing";
import { api, claimSavedBooks, fetchMe, forgetBook, savedBooks, type SavedBook } from "@/lib/client";
import { accentOf } from "@/lib/kinds";
import type { BookPayload, Me, StorageInfo } from "@/lib/types";

type Loaded = BookPayload & { storage: StorageInfo | null; canEdit?: boolean };
type State =
  | { kind: "loading" }
  | { kind: "landing"; me: Me | null }
  | { kind: "dashboard"; me: Me }
  | { kind: "book"; saved: SavedBook[]; data: Loaded };

/**
 * Home:
 *  - signed in: your timelines
 *  - signed out with Google sign-in available: the landing page
 *  - sign-in not set up: the timeline last used on this device
 */
export default function Home() {
  const [state, setState] = useState<State>({ kind: "loading" });

  async function openSaved(id?: string) {
    const saved = savedBooks();
    const pick = saved.find((b) => b.id === id) ?? saved.find((b) => b.key) ?? saved[0];
    if (!pick) return setState({ kind: "landing", me: null });
    try {
      const data = await api<Loaded>(`/api/books/${pick.id}`, { key: pick.key });
      setState({ kind: "book", saved, data });
    } catch (err) {
      if (/doesn't exist/.test((err as Error).message)) {
        forgetBook(pick.id);
        return openSaved();
      }
      setState({ kind: "landing", me: null });
    }
  }

  useEffect(() => {
    (async () => {
      let me = await fetchMe(true);
      if (me.user) {
        // Timelines made on this device before signing in join the account automatically.
        if (await claimSavedBooks(me.books.map((b) => b.id))) me = await fetchMe(true);
        return setState({ kind: "dashboard", me });
      }
      if (me.authEnabled) return setState({ kind: "landing", me });
      openSaved();
    })();
  }, []);

  if (state.kind === "loading") return <div className="center-page" aria-busy="true" />;
  if (state.kind === "landing") return <Landing me={state.me} />;
  if (state.kind === "dashboard") return <Dashboard me={state.me} />;
  if (!state.data.storage) return <Landing me={null} />;
  return (
    <BookView
      key={state.data.book.id}
      initial={state.data}
      storage={state.data.storage}
      initialCanEdit={state.data.canEdit}
      topbarExtra={<Switcher saved={state.saved} current={state.data.book.id} onPick={(id) => openSaved(id)} />}
    />
  );
}

function Switcher({ saved, current, onPick }: { saved: SavedBook[]; current: string; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-sm btn-ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {saved.length > 1 ? "Switch baby" : "New timeline"}
      </button>
      {open && (
        <div className="menu">
          {saved.map((b) => (
            <button
              key={b.id}
              style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: b.id === current ? 800 : 600 }}
              onClick={() => {
                setOpen(false);
                onPick(b.id);
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 9, border: "2px solid var(--line)", background: accentOf(b.accent).hex }} />
              {b.name}
            </button>
          ))}
          <Link href="/start">Start a new timeline</Link>
        </div>
      )}
    </div>
  );
}
