"use client";
import type { Photo, StorageInfo } from "./types";

/* ---------- saved timelines on this device ---------- */

export interface SavedBook {
  id: string;
  name: string;
  accent: string;
  key?: string;
  savedAt: number;
}

const BOOKS_KEY = "littlechrono.books";
const FRIEND_KEY = "littlechrono.friendName";

function safeGet(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

export function savedBooks(): SavedBook[] {
  try {
    const list = JSON.parse(safeGet(BOOKS_KEY) || "[]");
    return Array.isArray(list) ? list.sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch {
    return [];
  }
}

export function saveBookLocally(b: Omit<SavedBook, "savedAt">) {
  const others = savedBooks().filter((x) => x.id !== b.id);
  const prev = savedBooks().find((x) => x.id === b.id);
  safeSet(BOOKS_KEY, JSON.stringify([{ ...prev, ...b, key: b.key ?? prev?.key, savedAt: Date.now() }, ...others]));
}

export function forgetBook(id: string) {
  safeSet(BOOKS_KEY, JSON.stringify(savedBooks().filter((x) => x.id !== id)));
}

export const parentKeyFor = (id: string) => savedBooks().find((b) => b.id === id)?.key;

export const friendName = () => safeGet(FRIEND_KEY) || "";
export const rememberFriendName = (n: string) => safeSet(FRIEND_KEY, n);

/* ---------- API ---------- */

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; key?: string } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(opts.key ? { "x-parent-key": opts.key } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data as T;
}

export const mediaUrl = (p: Photo | string) =>
  `/api/media/${typeof p === "string" ? p : p.path}`;

export const shareUrl = (id: string) => `${location.origin}/b/${id}`;
export const parentUrl = (id: string, key: string) => `${location.origin}/b/${id}?key=${key}`;

/* ---------- photos ---------- */

export interface PreparedImage {
  blob: Blob;
  w: number;
  h: number;
  ext: string;
  previewUrl: string;
  takenAt?: string;
}

const MAX_EDGE = 1800;

async function exifDate(file: File): Promise<string | undefined> {
  try {
    const exifr = (await import("exifr")).default;
    const data = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const d: Date | undefined = data?.DateTimeOriginal || data?.CreateDate;
    if (d instanceof Date && !Number.isNaN(d.getTime()) && d.getFullYear() > 1990) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  } catch {}
  return undefined;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const takenAt = await exifDate(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`"${file.name}" can't be opened here. Try a JPEG or PNG version.`);
  }
  const { width, height } = bitmap;

  if (file.type === "image/gif") {
    bitmap.close();
    return { blob: file, w: width, h: height, ext: "gif", previewUrl: URL.createObjectURL(file), takenAt };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process photo."))), "image/jpeg", 0.86),
  );
  return { blob, w, h, ext: "jpg", previewUrl: URL.createObjectURL(blob), takenAt };
}

const rand = () => Math.random().toString(36).slice(2, 10);

export async function uploadImage(
  storage: StorageInfo,
  bookId: string,
  key: string | undefined,
  img: PreparedImage,
  onProgress?: (pct: number) => void,
): Promise<Photo> {
  if (storage.mode === "local") {
    const fd = new FormData();
    fd.append("file", new File([img.blob], `photo.${img.ext}`, { type: img.blob.type }));
    fd.append("bookId", bookId);
    if (key) fd.append("key", key);
    onProgress?.(30);
    const res = await fetch("/api/local-upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    onProgress?.(100);
    return { path: data.pathname, w: img.w, h: img.h };
  }
  const { upload } = await import("@vercel/blob/client");
  const result = await upload(`books/${bookId}/photos/${rand()}.${img.ext}`, img.blob, {
    access: storage.access,
    handleUploadUrl: "/api/upload",
    clientPayload: JSON.stringify({ bookId, key }),
    contentType: img.blob.type,
    onUploadProgress: (e) => onProgress?.(e.percentage),
  });
  return { path: result.pathname, w: img.w, h: img.h };
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
