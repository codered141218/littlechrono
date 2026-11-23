"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { agePhrase, todayISO } from "@/lib/age";
import { api, friendName, rememberFriendName } from "@/lib/client";
import type { Moment, PublicBook, StorageInfo } from "@/lib/types";
import { Doodle } from "./Icons";
import { PhotoPicker, usePhotoUploads } from "./PhotoPicker";
import { Sheet } from "./Sheet";

export function FriendSheet({
  book,
  storage,
  onClose,
  onSaved,
}: {
  book: PublicBook;
  storage: StorageInfo;
  onClose: () => void;
  onSaved: (m: Moment) => void;
}) {
  const [name, setName] = useState(friendName);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [dateTouched, setDateTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const photos = usePhotoUploads({
    storage,
    bookId: book.id,
    max: 6,
    onTakenAt: (d) => !dateTouched && setDate(d),
  });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Add your name so the parents know who shared this.");
    if (photos.busy) return setError("Hang on, photos are still uploading.");
    if (!photos.photos.length) return setError("Add at least one photo.");
    setSaving(true);
    try {
      const { moment } = await api<{ moment: Moment }>(`/api/books/${book.id}/moments`, {
        method: "POST",
        body: { authorName: name, title, date, photos: photos.photos },
      });
      rememberFriendName(name.trim());
      onSaved(moment);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Sheet title="Sent with love" onClose={onClose}>
        <motion.div
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          style={{ width: 120, margin: "6px auto 16px" }}
        >
          <Doodle kind="friend" />
        </motion.div>
        <p style={{ textAlign: "center", fontSize: 18 }}>
          Your photos are now on {book.name}&apos;s timeline, right where they belong in time.
        </p>
        <div className="sheet-foot" style={{ justifyContent: "center", marginTop: 22 }}>
          <button className="btn btn-primary" onClick={onClose}>
            See the timeline
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={`Add a photo of ${book.name}`} subtitle="Your photo goes on the timeline with your name on it." onClose={onClose}>
      <form onSubmit={send}>
        <PhotoPicker state={photos} label="Choose photos" hint="Up to 6 photos. We'll read the date from each photo when we can." />
        <label className="field">
          <span>Your name</span>
          <input className="input" value={name} maxLength={40} placeholder="Auntie Mae" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Caption (optional)</span>
          <input className="input" value={title} maxLength={80} placeholder="Nap time at Grandma's" onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span>When was it taken?</span>
          <input
            className="input"
            type="date"
            value={date}
            required
            onChange={(e) => {
              setDate(e.target.value);
              setDateTouched(true);
            }}
          />
          {date && <span className="age-preview">{agePhrase(book.name, book.birthDate, date)}</span>}
        </label>
        {error && <div className="error">{error}</div>}
        <div className="sheet-foot" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" disabled={saving || photos.busy}>
            {photos.busy ? "Uploading photos…" : saving ? "Sending…" : `Add to ${book.name}'s timeline`}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
