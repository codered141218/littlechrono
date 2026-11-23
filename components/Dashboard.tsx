"use client";
import { motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, liveAge } from "@/lib/age";
import { mediaUrl, savedBooks, type SavedBook } from "@/lib/client";
import { accentOf } from "@/lib/kinds";
import { nameOf } from "@/lib/names";
import type { Me } from "@/lib/types";
import { AccountMenu } from "./Account";
import { Doodle, Logo, PlusIcon } from "./Icons";

type Book = Me["books"][number];

function BabyCard({ book, i }: { book: Book; i: number }) {
  const [age, setAge] = useState("");
  useEffect(() => {
    const u = () => setAge(liveAge(book.birthDate, new Date(), book.birth?.time).headline);
    u();
    const t = setInterval(u, 60_000);
    return () => clearInterval(t);
  }, [book.birthDate, book.birth?.time]);
  const a = accentOf(book.accent);
  const short = nameOf(book);
  return (
    <motion.div
      initial={{ opacity: 0, y: -30, rotate: i % 2 ? 6 : -6 }}
      animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1 : -1 }}
      whileHover={{ rotate: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 180, damping: 11, delay: 0.08 * i }}
      style={{ transformOrigin: "50% 0" }}
    >
      <Link href={`/b/${book.id}`} className="baby-card" style={{ ["--card-accent" as string]: a.hex }}>
        <span className="peg" style={{ left: "calc(50% - 8px)" }} aria-hidden />
        <div className="blob">
          {book.coverPhoto ? <img src={mediaUrl(book.coverPhoto)} alt="" /> : <Doodle kind={i % 2 ? "first" : "everyday"} seed={i} />}
        </div>
        <div>
          <h2 className="display">{short}</h2>
          {book.name !== short && <p className="muted" style={{ marginTop: 4, fontWeight: 600 }}>{book.name}</p>}
        </div>
        <div className="meta">
          <span className="age-chip">{age || " "}</span>
          <span>
            {book.momentCount} {book.momentCount === 1 ? "moment" : "moments"}
          </span>
          {book.sex && <span>{book.sex === "girl" ? "Girl" : "Boy"}</span>}
        </div>
        <span className="hint">Born {formatDate(book.birthDate)}</span>
      </Link>
    </motion.div>
  );
}

export function Dashboard({ me }: { me: Me }) {
  const [others, setOthers] = useState<SavedBook[]>([]);
  useEffect(() => {
    const owned = new Set(me.books.map((b) => b.id));
    setOthers(savedBooks().filter((b) => !owned.has(b.id) && !b.key));
  }, [me.books]);
  const first = me.user?.name?.split(" ")[0];
  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <Link href="/" className="logo">
          <Logo />
          <span>LittleChrono</span>
        </Link>
        <div className="topbar-actions">
          <AccountMenu me={me} />
        </div>
      </header>
      <main className="dash">
        <h1>{first ? `Hi, ${first}` : "Your timelines"}</h1>
        <p>
          {me.books.length
            ? `You're keeping ${me.books.length === 1 ? "1 timeline" : `${me.books.length} timelines`}. Pick one to open it.`
            : "Start your first timeline. You can keep one for each little one."}
        </p>
        <div className="dash-grid">
          {me.books.map((b, i) => (
            <BabyCard key={b.id} book={b} i={i} />
          ))}
          <Link href="/start" className="new-card">
            <span className="plus">
              <PlusIcon size={30} />
            </span>
            Start a new timeline
          </Link>
        </div>
        {others.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: 48 }}>Shared with you</h2>
            <div className="pills">
              {others.map((b) => (
                <Link key={b.id} href={`/b/${b.id}`} className="pill" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 9, border: "2px solid var(--line)", background: accentOf(b.accent).hex }} />
                  {b.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </MotionConfig>
  );
}
