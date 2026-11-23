"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { formatDate, liveAge, todayISO, type LiveAge } from "@/lib/age";
import { mediaUrl } from "@/lib/client";
import { formatLength, formatTime, formatWeight, nameOf } from "@/lib/names";
import type { PublicBook } from "@/lib/types";
import { Doodle } from "./Icons";

const pad = (n: number) => String(n).padStart(2, "0");

function Ticker({ birth, time }: { birth: string; time?: string }) {
  const [age, setAge] = useState<LiveAge | null>(null);
  useEffect(() => {
    const tick = () => setAge(liveAge(birth, new Date(), time));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [birth, time]);
  if (!age) return <div className="ticker" style={{ visibility: "hidden" }}><b>0</b></div>;
  return (
    <div className="ticker" aria-label={age.unborn ? "Countdown to arrival" : "Time since birth"}>
      <span>{age.unborn ? "Countdown" : "Earthside for"}</span>
      <span>
        <b>{age.days.toLocaleString()}</b> {age.days === 1 ? "day" : "days"}
      </span>
      <span>
        <b>{pad(age.hours)}</b>h <b>{pad(age.minutes)}</b>m <b className="sec">{pad(age.seconds)}</b>s
      </span>
    </div>
  );
}

function Headline({ birth, time }: { birth: string; time?: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () => setText(liveAge(birth, new Date(), time).headline);
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [birth, time]);
  return <p className="hero-age">{text || " "}</p>;
}

export function Hero({ book, children }: { book: PublicBook; children: React.ReactNode }) {
  const short = nameOf(book);
  const ring = `Hello world, I'm ${short}! `.repeat(Math.max(2, Math.ceil(40 / (short.length + 17))));
  const unborn = book.birthDate > todayISO();
  return (
    <section className="hero">
      <motion.div
        className="cover"
        initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.1 }}
      >
        <svg className="cover-orbit" viewBox="0 0 200 200" aria-hidden style={{ animation: "spin 40s linear infinite" }}>
          <defs>
            <path id="ring" d="M100,100 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
          </defs>
          <text fontFamily="var(--font-display)" fontWeight="800" fontSize="11" letterSpacing="1.5" fill="var(--ink)">
            <textPath href="#ring" textLength="570" lengthAdjust="spacing">{ring}</textPath>
          </text>
        </svg>
        <div className="cover-blob" style={{ inset: "9%" }}>
          {book.coverPhoto ? (
            <img src={mediaUrl(book.coverPhoto)} alt={book.name} />
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", background: "var(--accent)" }}>
              <div style={{ width: "48%" }}>
                <Doodle kind="everyday" />
              </div>
            </div>
          )}
        </div>
        {book.sex && (
          <motion.span
            className="sex-sticker"
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.7 }}
          >
            It&apos;s a {book.sex}!
          </motion.span>
        )}
      </motion.div>

      <div className="hero-text">
        <h1
          className="display hero-name"
          aria-label={short}
          style={{ ["--fit" as string]: Math.min(42, 165 / Math.max(3, short.length)) }}
        >
          {Array.from(short).map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              initial={{ y: "60%", opacity: 0, rotate: i % 2 ? 8 : -8 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.15 + i * 0.05 }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </h1>
        {book.name.trim() !== short && <p className="full-name">{book.name}</p>}
        <Headline birth={book.birthDate} time={book.birth?.time} />
        <p className="hero-sub" suppressHydrationWarning>
          {unborn ? "Due" : "Born"} {formatDate(book.birthDate)}
        </p>
        <Ticker birth={book.birthDate} time={book.birth?.time} />
        <div className="hero-actions">{children}</div>
      </div>
    </section>
  );
}

/** Birth facts shown as a hospital-bracelet strip. */
export function Bracelet({ book, canEdit, onAdd }: { book: PublicBook; canEdit: boolean; onAdd: () => void }) {
  const d = book.birth ?? {};
  const unborn = book.birthDate > todayISO();
  const cells: { label: string; value: string; alt?: string }[] = [];
  cells.push({
    label: unborn ? "Due date" : "Born",
    value: formatDate(book.birthDate, { month: "short", day: "numeric", year: "numeric" }),
    alt: d.time ? formatTime(d.time) : undefined,
  });
  if (d.weightGrams) {
    const w = formatWeight(d.weightGrams, d.weightUnit);
    cells.push({ label: "Weight", value: w.main, alt: w.alt });
  }
  if (d.lengthCm) {
    const l = formatLength(d.lengthCm, d.lengthUnit);
    cells.push({ label: "Length", value: l.main, alt: l.alt });
  }
  if (d.doctor) cells.push({ label: "Doctor", value: d.doctor });
  if (d.place) cells.push({ label: "Place of birth", value: d.place });

  const hasDetails = cells.length > 1 || Boolean(d.time);
  if (!hasDetails && !canEdit) return null;

  return (
    <div className="bracelet-wrap">
      <motion.div
        className="bracelet"
        initial={{ scaleX: 0.2, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.5 }}
        style={{ transformOrigin: "0 50%" }}
      >
        <span className="snap" aria-hidden>
          <i />
          <i />
        </span>
        <div className="cells">
          <div className="cell">
            <small>Name</small>
            <b>{book.name}</b>
            {book.sex && <em>{book.sex === "girl" ? "Girl" : "Boy"}</em>}
          </div>
          {cells.map((c) => (
            <div className="cell" key={c.label}>
              <small>{c.label}</small>
              <b>{c.value}</b>
              {c.alt && <em>{c.alt}</em>}
            </div>
          ))}
          {!hasDetails && canEdit && !unborn && (
            <button className="btn btn-sm add" onClick={onAdd}>
              Add birth details
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
