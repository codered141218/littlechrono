"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ageLabel, formatDate, liveAge } from "@/lib/age";
import { mediaUrl } from "@/lib/client";
import type { Moment, Photo, PublicBook } from "@/lib/types";
import { CloseIcon, Doodle, PauseIcon, PlayIcon } from "./Icons";

type Slide =
  | { type: "intro" }
  | { type: "moment"; moment: Moment; photo?: Photo; first: boolean; ms: number };

const BASE_MS = 4800;

export function StoryPlayer({ book, moments, onClose }: { book: PublicBook; moments: Moment[]; onClose: () => void }) {
  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [{ type: "intro" }];
    for (const m of moments) {
      const ms = m.star ? BASE_MS * 1.5 : BASE_MS;
      const photos = m.photos.slice(0, m.star ? 6 : 3);
      if (!photos.length) out.push({ type: "moment", moment: m, first: true, ms });
      photos.forEach((p, i) => out.push({ type: "moment", moment: m, photo: p, first: i === 0, ms: i === 0 ? ms : BASE_MS * 0.7 }));
    }
    return out;
  }, [moments]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);

  const slide = slides[index];
  const duration = slide.type === "intro" ? 2800 : slide.ms;

  const go = useCallback(
    (dir: 1 | -1) => {
      elapsed.current = 0;
      setProgress(0);
      setIndex((i) => {
        const next = i + dir;
        if (next >= slides.length) {
          setEnded(true);
          return i;
        }
        return Math.max(0, next);
      });
    },
    [slides.length],
  );

  // timer
  useEffect(() => {
    if (paused || ended) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      elapsed.current += t - last;
      last = t;
      const p = Math.min(1, elapsed.current / duration);
      setProgress(p);
      if (p >= 1) go(1);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, paused, ended, duration, go]);

  // preload next photo
  useEffect(() => {
    const next = slides[index + 1];
    if (next?.type === "moment" && next.photo) new Image().src = mediaUrl(next.photo);
  }, [index, slides]);

  // keys + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    document.addEventListener("keydown", onKey);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = o;
    };
  }, [go, onClose]);

  const restart = () => {
    elapsed.current = 0;
    setProgress(0);
    setIndex(0);
    setEnded(false);
    setPaused(false);
  };

  // progress bars: one per moment (not per photo) so it reads as chapters of time
  const bars = useMemo(() => {
    const ids: string[] = [];
    slides.forEach((s) => s.type === "moment" && s.first && ids.push(s.moment.id));
    return ids;
  }, [slides]);
  const currentBar = slide.type === "moment" ? bars.indexOf(slide.moment.id) : -1;
  const now = liveAge(book.birthDate, new Date());

  return (
    <motion.div className="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${book.name}'s story`}>
      <div className="story-bars" aria-hidden>
        {bars.map((id, i) => (
          <span key={id}>
            <i style={{ width: i < currentBar || ended ? "100%" : i === currentBar ? `${progress * 100}%` : "0%" }} />
          </span>
        ))}
      </div>
      <div className="story-top">
        <button className="icon-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>
          {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
        </button>
        <button className="icon-btn" onClick={onClose} aria-label="Close story">
          <CloseIcon size={20} />
        </button>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={index}
          className="story-media"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {slide.type === "intro" ? (
            <div style={{ position: "absolute", inset: 0, background: "var(--accent)" }} />
          ) : slide.photo ? (
            <>
              <img className="blurfill" src={mediaUrl(slide.photo)} alt="" />
              <motion.img
                className="fit"
                src={mediaUrl(slide.photo)}
                alt={slide.moment.title}
                initial={{ scale: 1.0, x: 0 }}
                animate={{ scale: 1.1, x: index % 2 ? -14 : 14 }}
                transition={{ duration: slide.ms / 1000 + 1, ease: "linear" }}
              />
            </>
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "var(--accent)" }}>
              <motion.div
                style={{ width: "min(46vw, 320px)" }}
                initial={{ scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: 4 }}
                transition={{ type: "spring", stiffness: 120, damping: 10 }}
              >
                <Doodle kind={slide.moment.kind} seed={slide.moment.id.charCodeAt(0)} />
              </motion.div>
            </div>
          )}
          <div className="story-shade" />
        </motion.div>
      </AnimatePresence>

      <div className="story-tap">
        <button aria-label="Previous" onClick={() => go(-1)} />
        <button aria-label="Next" onClick={() => go(1)} />
      </div>

      <div className="story-text" style={{ pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          {slide.type === "intro" ? (
            <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="display story-title" style={{ fontSize: "clamp(56px, 13vw, 150px)", color: "white" }}>
                {book.name}
              </div>
              <div className="story-date" style={{ fontSize: 20 }}>
                {moments.length} moments, in the order they happened
              </div>
            </motion.div>
          ) : (
            slide.first && (
              <motion.div
                key={slide.moment.id}
                initial="hide"
                animate="show"
                exit={{ opacity: 0, y: -16 }}
                variants={{ show: { transition: { staggerChildren: 0.12 } } }}
              >
                <motion.div className="display story-age" variants={rise}>
                  {ageLabel(book.birthDate, slide.moment.date)}
                </motion.div>
                {slide.moment.title && (
                  <motion.h2 className="story-title" variants={rise}>
                    {slide.moment.title}
                  </motion.h2>
                )}
                {slide.moment.note && (
                  <motion.p className="story-note" variants={rise}>
                    {slide.moment.note.length > 180 ? slide.moment.note.slice(0, 180) + "…" : slide.moment.note}
                  </motion.p>
                )}
                <motion.p className="story-date" variants={rise}>
                  {formatDate(slide.moment.date)}
                  {slide.moment.author.name ? `, shared by ${slide.moment.author.name}` : ""}
                </motion.p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {ended && (
          <motion.div className="story-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div>
              <motion.h2
                className="display"
                initial={{ scale: 0.7, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                To be continued
              </motion.h2>
              <p style={{ marginTop: 16, fontSize: 20, opacity: 0.85 }}>
                {now.unborn ? `${book.name} is almost here.` : `${book.name} is ${now.headline} and counting.`}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={restart}>
                  <PlayIcon size={18} /> Watch again
                </button>
                <button className="btn" onClick={onClose}>
                  Back to the timeline
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const rise = {
  hide: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};
