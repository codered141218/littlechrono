import "server-only";
import { deletePaths, listPaths, readJSON, writeJSON } from "./storage";
import type { BirthDetails, Book, Moment, Photo, PublicBook } from "./types";
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
  const { keyHash, ownerIds, ...rest } = book;
  return rest;
}

/** Removes a whole timeline: moments, photos and the book itself. */
export async function deleteBook(id: string) {
  const paths = await listPaths(`books/${id}/`);
  const nested = await Promise.all(
    ["moments", "photos"].map((d) => listPaths(`books/${id}/${d}/`)),
  );
  await deletePaths([...new Set([...paths, ...nested.flat()])].filter((p) => !p.endsWith("/moments") && !p.endsWith("/photos")));
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

/** Validates the optional profile fields shared by create and update. */
export function cleanProfile(b: Record<string, unknown>) {
  const out: { nickname?: string; sex?: "girl" | "boy" | null; birth?: BirthDetails } = {};
  if ("nickname" in b) out.nickname = cleanText(b.nickname, 30) || undefined;
  if ("sex" in b) out.sex = b.sex === "girl" || b.sex === "boy" ? b.sex : null;
  if ("birth" in b && b.birth && typeof b.birth === "object") {
    const r = b.birth as Record<string, unknown>;
    const birth: BirthDetails = {};
    if (typeof r.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) birth.time = r.time;
    const g = Number(r.weightGrams);
    if (Number.isFinite(g) && g >= 200 && g <= 9000) birth.weightGrams = Math.round(g);
    birth.weightUnit = r.weightUnit === "lb" ? "lb" : "kg";
    const cm = Number(r.lengthCm);
    if (Number.isFinite(cm) && cm >= 20 && cm <= 80) birth.lengthCm = Math.round(cm * 10) / 10;
    birth.lengthUnit = r.lengthUnit === "in" ? "in" : "cm";
    const doctor = cleanText(r.doctor, 60);
    if (doctor) birth.doctor = doctor;
    const place = cleanText(r.place, 80);
    if (place) birth.place = place;
    out.birth = birth;
  }
  return out;
}

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
