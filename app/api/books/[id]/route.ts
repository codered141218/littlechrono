import { body, fail, json, route } from "@/lib/api";
import { keyFrom, keyMatches } from "@/lib/auth";
import { cleanPhotos, cleanText, deletePhotos, getBook, getMoments, isDate, saveBook, toPublic } from "@/lib/books";
import { isAccent } from "@/lib/kinds";
import { storageInfo } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return fail("This timeline doesn't exist. Check the link.", 404);
  return json({ book: toPublic(book), moments: await getMoments(id), storage: storageInfo() });
});

export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return fail("This timeline doesn't exist.", 404);
  if (!keyMatches(book, keyFrom(req))) return fail("Only parents can change this.", 403);
  const b = await body(req);

  if ("name" in b) {
    const name = cleanText(b.name, 40);
    if (!name) return fail("The name can't be empty.");
    book.name = name;
  }
  if ("birthDate" in b) {
    if (!isDate(b.birthDate)) return fail("That birth date isn't valid.");
    book.birthDate = b.birthDate;
  }
  if ("accent" in b && isAccent(b.accent)) book.accent = b.accent;
  if ("allowFriends" in b) book.allowFriends = Boolean(b.allowFriends);
  if ("coverPhoto" in b) {
    const photos = b.coverPhoto ? cleanPhotos(id, [b.coverPhoto]) : [];
    if (photos === null) return fail("That cover photo isn't valid.");
    const old = book.coverPhoto;
    book.coverPhoto = photos[0] ?? null;
    if (old && old.path !== book.coverPhoto?.path) await deletePhotos([old]);
  }
  book.updatedAt = new Date().toISOString();
  await saveBook(book);
  return json({ book: toPublic(book) });
});
