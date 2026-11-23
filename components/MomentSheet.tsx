"use client";
import { useState } from "react";
import { agePhrase, todayISO } from "@/lib/age";
import { nameOf } from "@/lib/names";
import { api } from "@/lib/client";
import { KINDS } from "@/lib/kinds";
import type { Moment, MomentKind, PublicBook, StorageInfo } from "@/lib/types";
import { PhotoPicker, usePhotoUploads } from "./PhotoPicker";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";

const SUGGESTIONS: { title: string; kind: MomentKind }[] = [
  { title: "First smile", kind: "first" },
  { title: "First laugh", kind: "first" },
  { title: "Rolled over", kind: "milestone" },
  { title: "Sat up alone", kind: "milestone" },
  { title: "First tooth", kind: "first" },
  { title: "First solid food", kind: "first" },
  { title: "Crawled", kind: "milestone" },
  { title: "First steps", kind: "milestone" },
  { title: "First word", kind: "first" },
  { title: "Check-up", kind: "growth" },
  { title: "First bath", kind: "first" },
  { title: "Birthday party", kind: "celebration" },
];

export type MomentPreset = { title?: string; date?: string; kind?: MomentKind; star?: boolean; note?: string };

export function MomentSheet({
  book,
  storage,
  parentKey,
  moment,
  preset,
  onClose,
  onSaved,
  onDeleted,
}: {
  book: PublicBook;
  storage: StorageInfo;
  parentKey?: string;
  moment?: Moment;
  preset?: MomentPreset;
  onClose: () => void;
  onSaved: (m: Moment) => void;
  onDeleted?: (id: string) => void;
}) {
  const toast = useToast();
  const editing = Boolean(moment);
  const isFriend = moment?.kind === "friend";
  const [title, setTitle] = useState(moment?.title ?? preset?.title ?? "");
  const [date, setDate] = useState(moment?.date ?? preset?.date ?? todayISO());
  const [dateTouched, setDateTouched] = useState(editing || Boolean(preset?.date));
  const [dateFromPhoto, setDateFromPhoto] = useState(false);
  const [kind, setKind] = useState<MomentKind>(moment?.kind ?? preset?.kind ?? "first");
  const [note, setNote] = useState(moment?.note ?? preset?.note ?? "");
  const [star, setStar] = useState(Boolean(moment?.star ?? preset?.star));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const photos = usePhotoUploads({
    storage,
    bookId: book.id,
    parentKey,
    initial: moment?.photos,
    max: 12,
    onTakenAt: (d) => {
      if (!dateTouched) {
        setDate(d);
        setDateFromPhoto(true);
      }
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (photos.busy) return setError("Hang on, photos are still uploading.");
    if (!title.trim() && !photos.photos.length) return setError("Give this moment a title or add a photo.");
    setSaving(true);
    try {
      const payload = { title, date, kind, note, star, photos: photos.photos };
      const { moment: saved } = editing
        ? await api<{ moment: Moment }>(`/api/books/${book.id}/moments/${moment!.id}`, { method: "PATCH", body: payload, key: parentKey })
        : await api<{ moment: Moment }>(`/api/books/${book.id}/moments`, { method: "POST", body: payload, key: parentKey });
      onSaved(saved);
      toast(editing ? "Moment saved" : `Added to ${nameOf(book)}'s timeline`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!moment || !confirm("Delete this moment and its photos? This can't be undone.")) return;
    setSaving(true);
    try {
      await api(`/api/books/${book.id}/moments/${moment.id}`, { method: "DELETE", key: parentKey });
      onDeleted?.(moment.id);
      toast("Moment deleted");
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Sheet
      title={editing ? "Edit moment" : "Add a moment"}
      subtitle={editing ? undefined : `Every moment lands in order on ${nameOf(book)}'s timeline.`}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <PhotoPicker state={photos} />

        <label className="field">
          <span>What happened?</span>
          <input
            className="input"
            value={title}
            maxLength={80}
            placeholder="First smile"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {!editing && !title && (
          <div className="pills" style={{ marginTop: -6, marginBottom: 16 }}>
            {SUGGESTIONS.map((s) => (
              <button
                type="button"
                key={s.title}
                className="pill suggest"
                onClick={() => {
                  setTitle(s.title);
                  setKind(s.kind);
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        <label className="field">
          <span>When?</span>
          <input
            className="input"
            type="date"
            value={date}
            required
            onChange={(e) => {
              setDate(e.target.value);
              setDateTouched(true);
              setDateFromPhoto(false);
            }}
          />
          {date && (
            <span className="age-preview">
              {agePhrase(nameOf(book), book.birthDate, date)}
              {dateFromPhoto && <span className="hint"> (date taken from the photo)</span>}
            </span>
          )}
        </label>

        {!isFriend && (
          <div className="field">
            <span className="label">Kind of moment</span>
            <div className="pills">
              {KINDS.filter((k) => k.id !== "friend").map((k) => (
                <button type="button" key={k.id} className="pill" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>The story behind it</span>
          <textarea
            className="textarea"
            value={note}
            maxLength={2000}
            placeholder="Who was there, what made it funny, what you want to remember."
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="toggle" role="switch" aria-checked={star} tabIndex={0} onClick={() => setStar(!star)} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), setStar(!star))}>
          <div>
            <div className="label">Mark as a big moment</div>
            <div className="hint">Big moments get a gold sticker and stay on screen longer in the story.</div>
          </div>
          <span className="switch" data-on={star} />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="sheet-foot">
          {editing ? (
            <button type="button" className="btn btn-sm btn-danger" onClick={remove} disabled={saving}>
              Delete moment
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" disabled={saving || photos.busy}>
            {photos.busy ? "Uploading photos…" : saving ? "Saving…" : editing ? "Save changes" : "Add to timeline"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
