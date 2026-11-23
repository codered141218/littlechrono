import { body, fail, json, route } from "@/lib/api";
import { hashKey } from "@/lib/auth";
import { cleanText, isDate, saveBook, toPublic } from "@/lib/books";
import { newBookId, newKey } from "@/lib/ids";
import { isAccent } from "@/lib/kinds";
import type { Book } from "@/lib/types";

export const POST = route(async (req: Request) => {
  const b = await body(req);
  const name = cleanText(b.name, 40);
  if (!name) return fail("Add your baby's name.");
  if (!isDate(b.birthDate)) return fail("Add a birth date (or due date).");
  const key = newKey();
  const now = new Date().toISOString();
  const book: Book = {
    id: newBookId(),
    name,
    birthDate: b.birthDate,
    accent: isAccent(b.accent) ? b.accent : "bubblegum",
    coverPhoto: null,
    allowFriends: true,
    createdAt: now,
    updatedAt: now,
    keyHash: hashKey(key),
  };
  await saveBook(book);
  return json({ book: toPublic(book), key }, 201);
});
