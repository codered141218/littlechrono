"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookView } from "@/components/BookView";
import { Landing } from "@/components/Landing";
import { api, forgetBook, savedBooks, type SavedBook } from "@/lib/client";
import { accentOf } from "@/lib/kinds";
import type { BookPayload, StorageInfo } from "@/lib/types";

type Loaded = BookPayload & { storage: StorageInfo | null };

/** Home: shows the timeline you use on this device, or the landing page for newcomers. */
export default function Home() {
  const [state, setState] = useState<"loading" | "landing" | { saved: SavedBook[]; data: Loaded }>("loading");

  async function open(id?: string) {
    const saved = savedBooks();
    const pick = saved.find((b) => b.id === id) ?? saved.find((b) => b.key) ?? saved[0];
    if (!pick) return setState("landing");
    try {
      const data = await api<Loaded>(`/api/books/${pick.id}`);
      setState({ saved, data });
    } catch (err) {
      if (/doesn't exist/.test((err as Error).message)) {
        forgetBook(pick.id);
        return open();
      }
      setState("landing");
    }
  }

  useEffect(() => {
    open();
  }, []);

  if (state === "loading") return <div className="center-page" aria-busy="true" />;
  if (state === "landing" || !state.data.storage) return <Landing />;

  const { data, saved } = state;
  return (
    <BookView
      key={data.book.id}
      initial={data}
      storage={data.storage!}
      topbarExtra={<Switcher saved={saved} current={data.book.id} onPick={(id) => open(id)} />}
    />
  );
}

function Switcher({ saved, current, onPick }: { saved: SavedBook[]; current: string; onPick: (id: string) => void }) {
  const [openMenu, setOpenMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpenMenu(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-sm btn-ghost" aria-expanded={openMenu} onClick={() => setOpenMenu((o) => !o)}>
        {saved.length > 1 ? "Switch baby" : "New timeline"}
      </button>
      <AnimatePresence>
        {openMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="panel"
            style={{ position: "absolute", right: 0, top: 48, padding: 10, minWidth: 220, display: "grid", gap: 4, zIndex: 50 }}
          >
            {saved.map((b) => (
              <button
                key={b.id}
                className="btn btn-sm btn-ghost"
                style={{ justifyContent: "flex-start", fontWeight: b.id === current ? 800 : 600 }}
                onClick={() => {
                  setOpenMenu(false);
                  onPick(b.id);
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 9, border: "2px solid var(--line)", background: accentOf(b.accent).hex }} />
                {b.name}
                {!b.key && <span className="hint">(shared)</span>}
              </button>
            ))}
            <Link href="/start" className="btn btn-sm btn-primary" style={{ marginTop: 6 }}>
              Start a new timeline
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
