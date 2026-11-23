import { body, fail, json, route } from "@/lib/api";
import { keyFrom, keyMatches } from "@/lib/auth";
import { cleanPhotos, cleanText, getBook, isDate, saveMoment } from "@/lib/books";
import { newMomentId } from "@/lib/ids";
import { isKind } from "@/lib/kinds";
import type { Moment } from "@/lib/types";

export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return fail("This timeline doesn't exist.", 404);
  const parent = keyMatches(book, keyFrom(req));
  const b = await body(req);

  const photos = cleanPhotos(id, b.photos);
  if (photos === null) return fail("One of the photos didn't upload correctly. Try adding it again.");
  if (!isDate(b.date)) return fail("Pick the date this happened.");

  const now = new Date().toISOString();
  let moment: Moment;

  if (parent) {
    const title = cleanText(b.title, 80);
    if (!title && !photos.length) return fail("Give this moment a title or a photo.");
    moment = {
      id: newMomentId(),
      bookId: id,
      title,
      date: b.date,
      note: cleanText(b.note, 2000) || undefined,
      kind: isKind(b.kind) ? b.kind : "everyday",
      star: Boolean(b.star),
      photos,
      author: { role: "parent" },
      createdAt: now,
      updatedAt: now,
    };
  } else {
    if (!book.allowFriends) return fail("The parents have paused photo sharing for now.", 403);
    const name = cleanText(b.authorName, 40);
    if (!name) return fail("Add your name so the parents know who shared this.");
    if (!photos.length) return fail("Add at least one photo.");
    moment = {
      id: newMomentId(),
      bookId: id,
      title: cleanText(b.title, 80),
      date: b.date,
      note: cleanText(b.note, 600) || undefined,
      kind: "friend",
      photos: photos.slice(0, 6),
      author: { role: "friend", name },
      createdAt: now,
      updatedAt: now,
    };
  }

  await saveMoment(moment);
  return json({ moment }, 201);
});
