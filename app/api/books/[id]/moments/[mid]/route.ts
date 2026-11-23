import { body, fail, json, route } from "@/lib/api";
import { keyFrom, keyMatches } from "@/lib/auth";
import { cleanPhotos, cleanText, deleteMoment, deletePhotos, getBook, getMoment, isDate, saveMoment } from "@/lib/books";
import { isKind } from "@/lib/kinds";

type Ctx = { params: Promise<{ id: string; mid: string }> };

async function load(req: Request, { params }: Ctx) {
  const { id, mid } = await params;
  const book = await getBook(id);
  if (!book) return { error: fail("This timeline doesn't exist.", 404) };
  if (!keyMatches(book, keyFrom(req))) return { error: fail("Only parents can change moments.", 403) };
  const moment = await getMoment(id, mid);
  if (!moment) return { error: fail("This moment was already removed.", 404) };
  return { book, moment };
}

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const r = await load(req, ctx);
  if (r.error) return r.error;
  const { moment } = r;
  const b = await body(req);

  if ("title" in b) moment.title = cleanText(b.title, 80);
  if ("note" in b) moment.note = cleanText(b.note, 2000) || undefined;
  if ("date" in b) {
    if (!isDate(b.date)) return fail("That date isn't valid.");
    moment.date = b.date;
  }
  if ("kind" in b && isKind(b.kind) && moment.kind !== "friend") moment.kind = b.kind;
  if ("star" in b) moment.star = Boolean(b.star);
  if ("photos" in b) {
    const photos = cleanPhotos(moment.bookId, b.photos);
    if (photos === null) return fail("One of the photos didn't upload correctly.");
    const keep = new Set(photos.map((p) => p.path));
    const removed = moment.photos.filter((p) => !keep.has(p.path));
    moment.photos = photos;
    await deletePhotos(removed);
  }
  if (!moment.title && !moment.photos.length) return fail("Give this moment a title or a photo.");
  moment.updatedAt = new Date().toISOString();
  await saveMoment(moment);
  return json({ moment });
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  const r = await load(req, ctx);
  if (r.error) return r.error;
  await deleteMoment(r.moment);
  return json({ ok: true });
});
