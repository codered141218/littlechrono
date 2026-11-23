"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { applyAccent } from "@/components/BookView";
import { Logo } from "@/components/Icons";
import { LinkBox } from "@/components/SettingsSheet";
import { liveAge, todayISO } from "@/lib/age";
import { api, parentUrl, saveBookLocally, shareUrl } from "@/lib/client";
import { ACCENTS } from "@/lib/kinds";
import type { Accent, PublicBook } from "@/lib/types";

export default function StartPage() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [accent, setAccent] = useState<Accent>("bubblegum");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ book: PublicBook; key: string } | null>(null);
  const [links, setLinks] = useState({ share: "", parent: "" });

  useEffect(() => applyAccent(accent), [accent]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Add your baby's name.");
    if (!birthDate) return setError("Add a birth date, or the due date if your baby isn't here yet.");
    setSaving(true);
    try {
      const res = await api<{ book: PublicBook; key: string }>("/api/books", { method: "POST", body: { name, birthDate, accent } });
      saveBookLocally({ id: res.book.id, name: res.book.name, accent: res.book.accent, key: res.key });
      setLinks({ share: shareUrl(res.book.id), parent: parentUrl(res.book.id, res.key) });
      setCreated(res);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const display = name.trim() || "Your baby";
  const age = birthDate ? liveAge(birthDate, new Date()) : null;

  return (
    <>
      <header className="topbar">
        <Link href="/" className="logo">
          <Logo />
          <span>LittleChrono</span>
        </Link>
      </header>
      <main className="start">
        <AnimatePresence mode="wait">
          {!created ? (
            <motion.form key="form" className="panel" onSubmit={create} exit={{ opacity: 0, x: -30 }}>
              <h1 style={{ fontSize: 40, marginBottom: 8 }}>Start a timeline</h1>
              <p className="muted" style={{ marginBottom: 22 }}>
                No account needed. You&apos;ll get a private parent link to edit from any device.
              </p>
              <label className="field">
                <span>Baby&apos;s name</span>
                <input className="input" value={name} maxLength={40} autoFocus placeholder="Maya" onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span>Birth date</span>
                <input className="input" type="date" value={birthDate} max="2100-12-31" onChange={(e) => setBirthDate(e.target.value)} />
                <span className="hint">Not born yet? Use the due date and the timeline counts down.</span>
              </label>
              <div className="field">
                <span className="label">Pick a color</span>
                <div className="swatches">
                  {ACCENTS.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      className="swatch"
                      style={{ background: a.hex }}
                      aria-label={a.name}
                      aria-pressed={accent === a.id}
                      onClick={() => setAccent(a.id)}
                    />
                  ))}
                </div>
              </div>
              {error && <div className="error">{error}</div>}
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={saving}>
                {saving ? "Creating…" : `Create ${name.trim() ? `${name.trim()}'s` : "the"} timeline`}
              </button>
            </motion.form>
          ) : (
            <motion.div key="done" className="panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 style={{ fontSize: 40, marginBottom: 8 }}>{created.book.name}&apos;s timeline is ready</h1>
              <p className="muted" style={{ marginBottom: 20 }}>Save these two links somewhere safe, like a note to yourself.</p>
              <div className="label">Share link, for friends and family</div>
              <p className="hint" style={{ marginBottom: 6 }}>They can watch the timeline and add their own photos.</p>
              <LinkBox url={links.share} label="Share link" />
              <div className="label" style={{ marginTop: 16 }}>Parent link, keep it private</div>
              <p className="hint" style={{ marginBottom: 6 }}>
                Opens the timeline with editing turned on. Send it to your partner, not to friends.
              </p>
              <LinkBox url={links.parent} label="Parent link" />
              <Link href={`/b/${created.book.id}`} className="btn btn-primary" style={{ width: "100%", marginTop: 20 }}>
                Open {created.book.name}&apos;s timeline
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="preview" aria-hidden>
          <motion.div
            key={display}
            className="display"
            initial={{ y: 10, opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {display}
          </motion.div>
          <p>
            {!age
              ? "is about to get a timeline"
              : age.unborn
                ? age.headline.replace("Arriving", "arriving")
                : birthDate === todayISO()
                  ? "was born today. Welcome!"
                  : `is ${age.headline}`}
          </p>
        </div>
      </main>
    </>
  );
}
