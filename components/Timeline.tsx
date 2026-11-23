"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ageLabel, chapterOf, formatDate, type Chapter } from "@/lib/age";
import { mediaUrl } from "@/lib/client";
import { nameOf } from "@/lib/names";
import type { Moment, PublicBook } from "@/lib/types";
import { Doodle, StarBurst } from "./Icons";

interface Anchor {
  x: number;
  y: number;
}

/** Builds a playful thread that wiggles between every card's hanging point. */
function threadPath(x: number, anchors: Anchor[], height: number, amp: number) {
  let d = `M ${x} 0`;
  let prev = 0;
  const pts = [...anchors.map((a) => a.y), height];
  pts.forEach((y, i) => {
    const dy = y - prev;
    const s = i % 2 ? amp : -amp;
    d += ` C ${x + s} ${prev + dy * 0.35}, ${x - s} ${prev + dy * 0.65}, ${x} ${y}`;
    prev = y;
  });
  return d;
}

export function Timeline({
  book,
  moments,
  onOpen,
}: {
  book: PublicBook;
  moments: Moment[];
  onOpen: (m: Moment) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ x: number; anchors: Anchor[]; h: number; amp: number }>({ x: 0, anchors: [], h: 0, amp: 0 });
  const [lit, setLit] = useState(0);

  const chapters = useMemo(() => {
    const map = new Map<string, { chapter: Chapter; moments: Moment[] }>();
    for (const m of moments) {
      const c = chapterOf(book.birthDate, m.date);
      if (!map.has(c.key)) map.set(c.key, { chapter: c, moments: [] });
      map.get(c.key)!.moments.push(m);
    }
    return [...map.values()].sort((a, b) => a.chapter.order - b.chapter.order);
  }, [moments, book.birthDate]);

  // Measure where each card hangs so the thread passes exactly through every peg.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const desktop = window.matchMedia("(min-width: 860px)").matches;
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const x = desktop ? box.width / 2 : pad + 26;
      const anchors = Array.from(el.querySelectorAll<HTMLElement>("[data-slot]")).map((s) => ({
        x,
        y: s.getBoundingClientRect().top - box.top - 3,
      }));
      setGeo({ x, anchors, h: Math.max(0, box.height - 80), amp: desktop ? 22 : 9 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [moments]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.8"] });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });

  useMotionValueEvent(drawn, "change", (v) => {
    if (!geo.h) return;
    const reach = v * geo.h + 4;
    const n = geo.anchors.filter((a) => a.y <= reach).length;
    if (n !== lit) setLit(n);
  });

  // Which age chapter is in the middle of the screen right now.
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set((e.target as HTMLElement).dataset.chapter!, e.isIntersecting));
        const keys = chapters.map((c) => c.chapter.key).filter((k) => visible.get(k));
        setCurrent(keys.length ? keys[keys.length - 1] : null);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    el.querySelectorAll("[data-chapter]").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [chapters]);
  const hud = chapters.find((c) => c.chapter.key === current)?.chapter;

  const d = geo.h ? threadPath(geo.x, geo.anchors, geo.h, geo.amp) : "";
  let slotIndex = 0;

  return (
    <div className="timeline" ref={ref}>
      <AnimatePresence>
        {hud && (
          <motion.div
            className="age-hud"
            aria-hidden
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={hud.key}
                className="dial display"
                style={{ fontSize: hud.big.length > 3 ? 16 : undefined }}
                initial={{ y: 40, rotate: 20 }}
                animate={{ y: 0, rotate: 0 }}
                exit={{ y: -40, rotate: -20 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                {hud.key === "bump" ? "Bump" : hud.key === "m0" ? "New" : hud.big}
              </motion.span>
            </AnimatePresence>
            <span className="roll">
              <small>{hud.key === "bump" ? `${nameOf(book)},` : hud.key === "m0" ? `${nameOf(book)} as` : `${nameOf(book)} at`}</small>
              <b>{hud.key === "bump" ? "on the way" : hud.key === "m0" ? "a newborn" : hud.small}</b>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <svg className="thread" width="100%" height="100%" aria-hidden>
        {d && (
          <>
            <path d={d} fill="none" stroke="var(--ink-3)" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" opacity="0.6" />
            <motion.path d={d} fill="none" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" style={{ pathLength: drawn }} />
            {geo.anchors.map((a, i) => (
              <motion.circle
                key={i}
                cx={a.x}
                cy={a.y}
                r={8}
                stroke="var(--line)"
                strokeWidth={2.5}
                initial={false}
                animate={{ scale: i < lit ? 1 : 0.45, fill: i < lit ? "var(--accent)" : "#ffffff" }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            ))}
          </>
        )}
      </svg>

      {chapters.map(({ chapter, moments: ms }) => (
        <section className="chapter" key={chapter.key} data-chapter={chapter.key} aria-label={`${chapter.big} ${chapter.small}`}>
          <motion.div
            className="chapter-head"
            initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
            whileInView={{ scale: 1, opacity: 1, rotate: -2 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
          >
            <span className="display big">{chapter.big}</span>
            <span className="small">{chapter.small}</span>
          </motion.div>
          <div className="moments">
            {ms.map((m) => {
              slotIndex++;
              return <Slot key={m.id} book={book} moment={m} side={slotIndex % 2 === 1 ? 1 : -1} index={slotIndex} onOpen={onOpen} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const Slot = memo(function Slot({
  book,
  moment,
  side,
  index,
  onOpen,
}: {
  book: PublicBook;
  moment: Moment;
  side: 1 | -1;
  index: number;
  onOpen: (m: Moment) => void;
}) {
  return (
    <div className={`slot ${side === 1 ? "left" : "right"}`} data-slot>
      <span className="slot-string" aria-hidden />
      <motion.button
        type="button"
        className={`card${moment.star ? " star" : ""}`}
        onClick={() => onOpen(moment)}
        initial={{ opacity: 0, y: -28, rotate: side * 9 }}
        whileInView={{ opacity: 1, y: 0, rotate: side * (index % 3 === 0 ? 0.6 : 1.4) }}
        whileHover={{ rotate: 0, y: -3 }}
        whileTap={{ scale: 0.98 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ type: "spring", stiffness: 170, damping: 9, mass: 0.8 }}
        aria-label={`${moment.title || "Photo"}, ${ageLabel(book.birthDate, moment.date)}`}
      >
        <span className="peg" aria-hidden />
        {moment.star && <StarBurst />}
        <CardMedia moment={moment} />
        <div className="card-meta">
          <span className="age-chip">{ageLabel(book.birthDate, moment.date)}</span>
          <span className="date">{formatDate(moment.date, { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        {moment.title && <h3 className="card-title">{moment.title}</h3>}
        {moment.note && <p className="card-note">{moment.note}</p>}
        {moment.author.role === "friend" && (
          <span className="byline">
            <span className="avatar">{moment.author.name?.[0]?.toUpperCase()}</span>
            Shared by {moment.author.name}
          </span>
        )}
      </motion.button>
    </div>
  );
});

function CardMedia({ moment }: { moment: Moment }) {
  const [main, ...rest] = moment.photos;
  if (!main)
    return (
      <div className="no-photo">
        <Doodle kind={moment.kind} seed={moment.id.charCodeAt(1)} />
      </div>
    );
  const ratio = Math.min(1.25, Math.max(0.68, main.h / main.w));
  return (
    <div className="photo-stack">
      {rest.slice(0, 2).map((p, i) => (
        <div key={p.path} className="back" style={{ transform: `rotate(${i ? -6 : 5}deg) translate(${i ? -6 : 8}px, ${i ? 4 : -2}px)` }}>
          <img src={mediaUrl(p)} alt="" loading="lazy" />
        </div>
      ))}
      <div className="photo-main" style={{ aspectRatio: `1 / ${ratio}` }}>
        <img src={mediaUrl(main)} alt={moment.title} loading="lazy" width={main.w} height={main.h} />
        {rest.length > 0 && <span className="photo-count">+{rest.length}</span>}
      </div>
    </div>
  );
}
