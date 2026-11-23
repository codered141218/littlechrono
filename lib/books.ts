import "server-only";
import { deletePaths, listPaths, readJSON, writeJSON } from "./storage";
import type { Book, Moment, Photo, PublicBook } from "./types";
import { isBookId, isMomentId } from "./ids";

const bookPath = (id: string) => `books/${id}/book.json`;
const momentsPrefix = (id: string) => `books/${id}/moments/`;
const momentPath = (id: string, mid: string) => `books/${id}/moments/${mid}.json`;

export async function getBook(id: string): Promise<Book | null> {
  if (!isBookId(id)) return null;
  return readJSON<Book>(bookPath(id));
}

export const saveBook = (book: Book) => writeJSON(bookPath(book.id), book);

export function toPublic(book: Book): PublicBook {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash, ...rest } = book;
  return rest;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

export { byChronologyClient as byChronology } from "./sort";
import { byChronologyClient as byChronology } from "./sort";

export async function getMoments(id: string): Promise<Moment[]> {
  const paths = (await listPaths(momentsPrefix(id))).filter((p) => p.endsWith(".json"));
  const moments = await mapLimit(paths, 24, (p) => readJSON<Moment>(p));
  return moments.filter((m): m is Moment => Boolean(m)).sort(byChronology);
}

export async function getMoment(id: string, mid: string): Promise<Moment | null> {
  if (!isMomentId(mid)) return null;
  return readJSON<Moment>(momentPath(id, mid));
}

export const saveMoment = (m: Moment) => writeJSON(momentPath(m.bookId, m.id), m);

export async function deleteMoment(m: Moment, alsoPhotos: Photo[] = m.photos) {
  await deletePaths([momentPath(m.bookId, m.id)]);
  await deletePaths(alsoPhotos.map((p) => p.path)).catch(() => {});
}

export const deletePhotos = (photos: Photo[]) =>
  deletePaths(photos.map((p) => p.path)).catch(() => {});

/* ---------- validation helpers ---------- */

export const isDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export const cleanText = (s: unknown, max: number) =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

export function cleanPhotos(bookId: string, input: unknown, max = 12): Photo[] | null {
  if (!Array.isArray(input)) return [];
  const re = new RegExp(`^books/${bookId}/photos/[A-Za-z0-9._-]+$`);
  const out: Photo[] = [];
  for (const p of input.slice(0, max)) {
    if (!p || typeof p !== "object") return null;
    const { path, w, h } = p as Record<string, unknown>;
    if (typeof path !== "string" || !re.test(path)) return null;
    out.push({
      path,
      w: Math.max(1, Math.round(Number(w) || 1)),
      h: Math.max(1, Math.round(Number(h) || 1)),
    });
  }
  return out;
}
