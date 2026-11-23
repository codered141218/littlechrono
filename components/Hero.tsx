"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { formatDate, liveAge, todayISO, type LiveAge } from "@/lib/age";
import { mediaUrl } from "@/lib/client";
import type { PublicBook } from "@/lib/types";
import { Doodle } from "./Icons";

const pad = (n: number) => String(n).padStart(2, "0");

function Ticker({ birth }: { birth: string }) {
  const [age, setAge] = useState<LiveAge | null>(null);
  useEffect(() => {
    const tick = () => setAge(liveAge(birth, new Date()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [birth]);
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

function Headline({ birth }: { birth: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () => setText(liveAge(birth, new Date()).headline);
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [birth]);
  return <p className="hero-age">{text || " "}</p>;
}

export function Hero({ book, children }: { book: PublicBook; children: React.ReactNode }) {
  const ring = `Hello world, I'm ${book.name}! `.repeat(Math.max(2, Math.ceil(40 / (book.name.length + 17))));
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
            <img src={mediaUrl(book.coverPhoto)} alt={`${book.name}`} />
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", background: "var(--accent)" }}>
              <div style={{ width: "48%" }}>
                <Doodle kind="everyday" />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="hero-text">
        <h1
          className="display hero-name"
          aria-label={book.name}
          style={{ ["--fit" as string]: Math.min(42, 165 / Math.max(3, book.name.length)) }}
        >
          {Array.from(book.name).map((ch, i) => (
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
        <Headline birth={book.birthDate} />
        <p className="hero-sub" suppressHydrationWarning>
          {book.birthDate > todayISO() ? "Due" : "Born"} {formatDate(book.birthDate)}
        </p>
        <Ticker birth={book.birthDate} />
        <div className="hero-actions">{children}</div>
      </div>
    </section>
  );
}
