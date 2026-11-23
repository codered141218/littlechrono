"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ageLabel, formatDate } from "@/lib/age";
import { mediaUrl } from "@/lib/client";
import { kindLabel } from "@/lib/kinds";
import type { Moment, PublicBook } from "@/lib/types";
import { Doodle } from "./Icons";
import { Sheet } from "./Sheet";

export function MomentViewer({
  book,
  moment,
  isParent,
  onClose,
  onEdit,
}: {
  book: PublicBook;
  moment: Moment;
  isParent: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [i, setI] = useState(0);
  const photo = moment.photos[i];
  return (
    <Sheet title={moment.title || (moment.author.name ? `From ${moment.author.name}` : "A moment")} wide onClose={onClose}>
      {photo ? (
        <>
          <div className="viewer-photo">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={photo.path}
                src={mediaUrl(photo)}
                alt={moment.title}
                width={photo.w}
                height={photo.h}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>
          </div>
          {moment.photos.length > 1 && (
            <div className="viewer-strip">
              {moment.photos.map((p, idx) => (
                <button key={p.path} aria-current={idx === i} aria-label={`Photo ${idx + 1}`} onClick={() => setI(idx)}>
                  <img src={mediaUrl(p)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="no-photo">
          <Doodle kind={moment.kind} seed={moment.id.charCodeAt(0)} />
        </div>
      )}

      <div className="card-meta" style={{ padding: 0 }}>
        <span className="age-chip">{ageLabel(book.birthDate, moment.date)}</span>
        <span className="date">
          {formatDate(moment.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
        <span className="date">{kindLabel(moment.kind)}</span>
      </div>
      {moment.note && <p style={{ marginTop: 14, whiteSpace: "pre-wrap", maxWidth: "62ch" }}>{moment.note}</p>}
      {moment.author.role === "friend" && (
        <div className="byline" style={{ padding: 0 }}>
          <span className="avatar">{moment.author.name?.[0]?.toUpperCase()}</span>
          Shared by {moment.author.name}
        </div>
      )}
      {isParent && (
        <div className="sheet-foot" style={{ marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onEdit}>
            {moment.kind === "friend" ? "Edit or remove" : "Edit moment"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
