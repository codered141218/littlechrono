import { body, fail, json, route } from "@/lib/api";
import { authEnabled, currentUser, hashKey } from "@/lib/auth";
import { cleanProfile, cleanText, isDate, saveBook, toPublic } from "@/lib/books";
import { newBookId, newKey } from "@/lib/ids";
import { isAccent } from "@/lib/kinds";
import type { Book } from "@/lib/types";
import { addBookToUser } from "@/lib/users";

export const POST = route(async (req: Request) => {
  const user = await currentUser();
  if (authEnabled() && !user) return fail("Sign in with Google to create a timeline.", 401);
  const b = await body(req);
  const name = cleanText(b.name, 60);
  if (!name) return fail("Add your baby's name.");
  if (!isDate(b.birthDate)) return fail("Add a birth date (or due date).");
  const key = newKey();
  const now = new Date().toISOString();
  const book: Book = {
    id: newBookId(),
    name,
    ...cleanProfile(b),
    birthDate: b.birthDate,
    accent: isAccent(b.accent) ? b.accent : "bubblegum",
    coverPhoto: null,
    allowFriends: true,
    ownerIds: user ? [user.id] : [],
    createdAt: now,
    updatedAt: now,
    keyHash: hashKey(key),
  };
  await saveBook(book);
  if (user) await addBookToUser(user, book.id);
  return json({ book: toPublic(book), key }, 201);
});
