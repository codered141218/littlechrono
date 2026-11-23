"use client";
import { useEffect, useState } from "react";
import { api, copyText, forgetBook, mediaUrl, parentUrl, saveBookLocally, shareUrl } from "@/lib/client";
import { ACCENTS } from "@/lib/kinds";
import type { Accent, PublicBook, StorageInfo } from "@/lib/types";
import { PhotoPicker, usePhotoUploads } from "./PhotoPicker";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";

export function LinkBox({ url, label }: { url: string; label: string }) {
  const toast = useToast();
  return (
    <div className="linkbox">
      <code title={url}>{url.replace(/^https?:\/\//, "")}</code>
      <button
        type="button"
        className="btn btn-sm btn-sun"
        onClick={async () => toast((await copyText(url)) ? `${label} copied` : "Couldn't copy. Select the link and copy it.")}
      >
        Copy
      </button>
    </div>
  );
}

export function ShareSheet({ book, isParent, onClose }: { book: PublicBook; isParent: boolean; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(shareUrl(book.id));
    setCanShare(typeof navigator.share === "function");
  }, [book.id]);
  return (
    <Sheet
      title={`Share ${book.name}'s timeline`}
      subtitle={
        book.allowFriends
          ? "Anyone with this link can watch the timeline and add their own photos."
          : "Anyone with this link can watch the timeline. Photo sharing is paused."
      }
      onClose={onClose}
    >
      {url && <LinkBox url={url} label="Share link" />}
      {canShare && (
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 10 }}
          onClick={() =>
            navigator
              .share({
                title: `${book.name}'s timeline`,
                text: book.allowFriends ? `Have a photo of ${book.name}? Add it to the timeline!` : `See ${book.name} grow up, one moment at a time.`,
                url,
              })
              .catch(() => {})
          }
        >
          Send with…
        </button>
      )}
      {isParent && (
        <p className="hint" style={{ marginTop: 14 }}>
          This link can&apos;t edit or delete anything. Your parent link is in Settings.
        </p>
      )}
    </Sheet>
  );
}

export function SettingsSheet({
  book,
  storage,
  parentKey,
  onClose,
  onSaved,
  onAccentPreview,
}: {
  book: PublicBook;
  storage: StorageInfo;
  parentKey: string;
  onClose: () => void;
  onSaved: (b: PublicBook) => void;
  onAccentPreview: (a: Accent | null) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(book.name);
  const [birthDate, setBirthDate] = useState(book.birthDate);
  const [accent, setAccent] = useState<Accent>(book.accent);
  const [allowFriends, setAllowFriends] = useState(book.allowFriends);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState({ share: "", parent: "" });
  const cover = usePhotoUploads({
    storage,
    bookId: book.id,
    parentKey,
    initial: book.coverPhoto ? [book.coverPhoto] : [],
    max: 1,
  });

  useEffect(() => setLinks({ share: shareUrl(book.id), parent: parentUrl(book.id, parentKey) }), [book.id, parentKey]);

  const close = () => {
    onAccentPreview(null);
    onClose();
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (cover.busy) return setError("Hang on, the cover photo is still uploading.");
    setSaving(true);
    setError("");
    try {
      const { book: saved } = await api<{ book: PublicBook }>(`/api/books/${book.id}`, {
        method: "PATCH",
        key: parentKey,
        body: { name, birthDate, accent, allowFriends, coverPhoto: cover.photos[0] ?? null },
      });
      saveBookLocally({ id: saved.id, name: saved.name, accent: saved.accent, key: parentKey });
      onSaved(saved);
      onAccentPreview(null);
      toast("Settings saved");
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Sheet title="Settings" onClose={close}>
      <form onSubmit={save}>
        <div className="row">
          <label className="field">
            <span>Baby&apos;s name</span>
            <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Birth date (or due date)</span>
            <input className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </label>
        </div>

        <div className="field">
          <span className="label">Timeline color</span>
          <div className="swatches">
            {ACCENTS.map((a) => (
              <button
                type="button"
                key={a.id}
                className="swatch"
                style={{ background: a.hex }}
                aria-label={a.name}
                aria-pressed={accent === a.id}
                onClick={() => {
                  setAccent(a.id);
                  onAccentPreview(a.id);
                }}
              />
            ))}
          </div>
        </div>

        <div className="label" style={{ marginBottom: 6 }}>Cover photo</div>
        <PhotoPicker state={cover} label="Choose a cover photo" hint="Shown in the bubble at the top of the timeline." />

        <div
          className="toggle"
          role="switch"
          aria-checked={allowFriends}
          tabIndex={0}
          onClick={() => setAllowFriends(!allowFriends)}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), setAllowFriends(!allowFriends))}
        >
          <div>
            <div className="label">Friends can add photos</div>
            <div className="hint">People with the share link can add photos. You can delete any of them.</div>
          </div>
          <span className="switch" data-on={allowFriends} />
        </div>

        {error && <div className="error">{error}</div>}
        <div className="sheet-foot" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" disabled={saving || cover.busy}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      <h3 className="section-title">Links</h3>
      <div className="label">Share link, for friends and family</div>
      {links.share && <LinkBox url={links.share} label="Share link" />}
      <div className="label" style={{ marginTop: 14 }}>Parent link, keep it private</div>
      <p className="hint" style={{ marginBottom: 6 }}>
        Open this on your partner&apos;s phone or a new device to edit the timeline there. Anyone with it can edit and delete.
      </p>
      {links.parent && <LinkBox url={links.parent} label="Parent link" />}

      <button
        type="button"
        className="btn btn-sm btn-ghost"
        style={{ marginTop: 18 }}
        onClick={() => {
          if (!confirm("Remove parent access on this device? You'll need the parent link to edit again.")) return;
          forgetBook(book.id);
          location.href = `/b/${book.id}`;
        }}
      >
        Remove parent access on this device
      </button>
    </Sheet>
  );
}

export function coverSrc(book: PublicBook) {
  return book.coverPhoto ? mediaUrl(book.coverPhoto) : null;
}
