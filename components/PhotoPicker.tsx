"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { mediaUrl, prepareImage, uploadImage } from "@/lib/client";
import type { Photo, StorageInfo } from "@/lib/types";
import { CameraIcon } from "./Icons";

export interface PhotoItem {
  id: string;
  preview: string;
  progress: number;
  photo?: Photo;
  error?: string;
  takenAt?: string;
}

/** Prepares and uploads photos as soon as they're picked, so saving is instant. */
export function usePhotoUploads(opts: {
  storage: StorageInfo;
  bookId: string;
  parentKey?: string;
  initial?: Photo[];
  max: number;
  onTakenAt?: (date: string) => void;
}) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    (opts.initial ?? []).map((p) => ({ id: p.path, preview: mediaUrl(p), progress: 100, photo: p })),
  );
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const countRef = useRef(items.length);
  countRef.current = items.length;

  const patch = (id: string, p: Partial<PhotoItem>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const add = useCallback((files: FileList | File[]) => {
    const { storage, bookId, parentKey, max, onTakenAt } = optsRef.current;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const currentCount = countRef.current;
    const picked = list.slice(0, Math.max(0, max - currentCount));
    if (!picked.length) return;
    countRef.current += picked.length;
    const fresh = picked.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      preview: "",
      progress: 2,
      file: f,
    }));
    setItems((current) => [...current, ...fresh.map(({ file: _f, ...rest }) => rest)]);
    fresh.forEach(async (it, i) => {
      try {
        const img = await prepareImage(it.file);
        patch(it.id, { preview: img.previewUrl, takenAt: img.takenAt, progress: 8 });
        if (i === 0 && currentCount === 0 && img.takenAt) onTakenAt?.(img.takenAt);
        const photo = await uploadImage(storage, bookId, parentKey, img, (pct) =>
          patch(it.id, { progress: Math.max(8, Math.min(99, pct)) }),
        );
        patch(it.id, { photo, progress: 100 });
      } catch (err) {
        patch(it.id, { error: (err as Error).message || "Upload failed", progress: 0 });
      }
    });
  }, []);

  const remove = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));

  const busy = items.some((x) => !x.photo && !x.error);
  const photos = items.filter((x) => x.photo).map((x) => x.photo!);
  const errors = items.filter((x) => x.error).map((x) => x.error!);
  return { items, add, remove, busy, photos, errors, full: items.length >= opts.max };
}

export function PhotoPicker({
  state,
  label = "Add photos",
  hint = "Drop them here or tap to choose. We'll shrink big photos so they upload fast.",
}: {
  state: ReturnType<typeof usePhotoUploads>;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) state.add(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [state]);

  return (
    <div className="field">
      {!state.full && (
        <div
          className={`drop${over ? " over" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            state.add(e.dataTransfer.files);
          }}
        >
          <CameraIcon size={30} />
          <strong>{label}</strong>
          <span className="hint">{hint}</span>
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) state.add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {state.items.length > 0 && (
        <div className="thumbs">
          <AnimatePresence initial={false}>
            {state.items.map((it, i) => (
              <motion.div
                key={it.id}
                className={`thumb${it.error ? " err" : ""}`}
                layout
                initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                title={it.error}
              >
                {it.preview && <img src={it.preview} alt="" />}
                {i === 0 && !it.error && <span className="first">Cover</span>}
                {!it.photo && !it.error && (
                  <span className="bar">
                    <i style={{ width: `${it.progress}%` }} />
                  </span>
                )}
                <button type="button" className="x" aria-label="Remove photo" onClick={() => state.remove(it.id)}>
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {state.errors.length > 0 && <span className="hint" style={{ color: "#c62828" }}>{state.errors[0]}</span>}
    </div>
  );
}
