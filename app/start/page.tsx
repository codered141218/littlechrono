"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountMenu, SignInButton } from "@/components/Account";
import { BirthFields, birthPayload, emptyBirthForm, type BirthForm } from "@/components/BirthFields";
import { applyAccent } from "@/components/BookView";
import { Logo } from "@/components/Icons";
import { LinkBox } from "@/components/SettingsSheet";
import { liveAge, todayISO } from "@/lib/age";
import { api, fetchMe, parentUrl, saveBookLocally, shareUrl } from "@/lib/client";
import { ACCENTS } from "@/lib/kinds";
import { birthSentence, nameOf } from "@/lib/names";
import type { Accent, Me, PublicBook } from "@/lib/types";

export default function StartPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [details, setDetails] = useState<BirthForm>(emptyBirthForm);
  const [showDetails, setShowDetails] = useState(true);
  const [accent, setAccent] = useState<Accent>("bubblegum");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ book: PublicBook; key: string } | null>(null);
  const [links, setLinks] = useState({ share: "", parent: "" });

  useEffect(() => applyAccent(accent), [accent]);
  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  const unborn = Boolean(birthDate) && birthDate > todayISO();
  const needsSignIn = Boolean(me?.authEnabled && !me.user);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Add your baby's name.");
    if (!birthDate) return setError("Add a birth date, or the due date if your baby isn't here yet.");
    setSaving(true);
    try {
      const res = await api<{ book: PublicBook; key: string }>("/api/books", {
        method: "POST",
        body: { name, birthDate, accent, ...birthPayload(details) },
      });
      saveBookLocally({ id: res.book.id, name: nameOf(res.book), accent: res.book.accent, key: res.key });
      setLinks({ share: shareUrl(res.book.id), parent: parentUrl(res.book.id, res.key) });
      setCreated(res);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const preview = { name: name.trim() || "Your baby", nickname: details.nickname };
  const display = nameOf(preview);
  const age = birthDate ? liveAge(birthDate, new Date(), details.time || undefined) : null;
  const facts = birthDate && !unborn ? birthSentence({ birth: birthPayload(details).birth }) : "";

  return (
    <>
      <header className="topbar">
        <Link href="/" className="logo">
          <Logo />
          <span>LittleChrono</span>
        </Link>
        <div className="topbar-actions">
          <AccountMenu me={me} />
        </div>
      </header>
      <main className="start">
        <AnimatePresence mode="wait">
          {needsSignIn ? (
            <motion.div key="signin" className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 style={{ fontSize: 40, marginBottom: 8 }}>Start a timeline</h1>
              <p className="muted" style={{ marginBottom: 22 }}>
                Sign in with Google first. Your timelines are saved to your account, so you can manage them from any phone or
                computer. Friends and family never need to sign in.
              </p>
              <SignInButton className="btn btn-primary" callbackUrl="/start" label="Continue with Google" />
            </motion.div>
          ) : !created ? (
            <motion.form key="form" className="panel" onSubmit={create} exit={{ opacity: 0, x: -30 }}>
              <h1 style={{ fontSize: 40, marginBottom: 8 }}>Start a timeline</h1>
              <p className="muted" style={{ marginBottom: 22 }}>
                {me?.user
                  ? `It will be saved to your account (${me.user.email}).`
                  : "No account needed. You'll get a private parent link to edit from any device."}
              </p>
              <label className="field">
                <span>Baby&apos;s full name</span>
                <input className="input" value={name} maxLength={60} autoFocus placeholder="Maya Lorraine Cruz" onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span>{unborn ? "Due date" : "Birth date"}</span>
                <input className="input" type="date" value={birthDate} max="2100-12-31" onChange={(e) => setBirthDate(e.target.value)} />
                <span className="hint">Not born yet? Use the due date and the timeline counts down.</span>
              </label>

              <button type="button" className="details-toggle" aria-expanded={showDetails} onClick={() => setShowDetails((s) => !s)}>
                {unborn ? "Nickname and girl or boy" : "Birth details: time, weight, doctor and more"}
                <span aria-hidden>{showDetails ? "–" : "+"}</span>
              </button>
              <AnimatePresence initial={false}>
                {showDetails && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <BirthFields value={details} onChange={setDetails} unborn={unborn} />
                  </motion.div>
                )}
              </AnimatePresence>

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
                {saving ? "Creating…" : `Create ${name.trim() ? `${display}'s` : "the"} timeline`}
              </button>
            </motion.form>
          ) : (
            <motion.div key="done" className="panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 style={{ fontSize: 40, marginBottom: 8 }}>{nameOf(created.book)}&apos;s timeline is ready</h1>
              <p className="muted" style={{ marginBottom: 20 }}>
                {me?.user
                  ? "It's saved to your account. Share this link with friends and family:"
                  : "Save these two links somewhere safe, like a note to yourself."}
              </p>
              <div className="label">Share link, for friends and family</div>
              <p className="hint" style={{ marginBottom: 6 }}>They can watch the timeline and add their own photos. No sign-in needed.</p>
              <LinkBox url={links.share} label="Share link" />
              {!me?.user && (
                <>
                  <div className="label" style={{ marginTop: 16 }}>Parent link, keep it private</div>
                  <p className="hint" style={{ marginBottom: 6 }}>
                    Opens the timeline with editing turned on. Send it to your partner, not to friends.
                  </p>
                  <LinkBox url={links.parent} label="Parent link" />
                </>
              )}
              {me?.user && (
                <p className="hint" style={{ marginTop: 12 }}>
                  Want your partner to manage it too? Open Settings on the timeline and send them the co-parent link.
                </p>
              )}
              <Link href={`/b/${created.book.id}`} className="btn btn-primary" style={{ width: "100%", marginTop: 20 }}>
                Open {nameOf(created.book)}&apos;s timeline
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
          {name.trim() && display !== name.trim() && <p style={{ fontSize: 20, opacity: 0.9 }}>{name.trim()}</p>}
          <p>
            {!age
              ? "is about to get a timeline"
              : age.unborn
                ? age.headline.replace("Arriving", "arriving")
                : birthDate === todayISO()
                  ? "was born today. Welcome!"
                  : `is ${age.headline}`}
          </p>
          {details.sex && (
            <span className="sex-sticker" style={{ position: "static", display: "inline-block", marginTop: 18, color: "var(--ink)" }}>
              It&apos;s a {details.sex}!
            </span>
          )}
          {facts && <p style={{ fontSize: 17, fontFamily: "var(--font-body)", fontWeight: 600, opacity: 0.95 }}>{facts}</p>}
        </div>
      </main>
    </>
  );
}
