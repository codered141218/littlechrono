import "server-only";
import { readJSON, writeJSON } from "./storage";
import type { SessionUser } from "./auth";
import type { UserIndex } from "./types";

const safeId = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, "");
const userPath = (id: string) => `users/${safeId(id)}.json`;

export async function getUserIndex(user: SessionUser): Promise<UserIndex> {
  const existing = await readJSON<UserIndex>(userPath(user.id));
  return (
    existing ?? { id: user.id, email: user.email, name: user.name, image: user.image, books: [], updatedAt: new Date().toISOString() }
  );
}

async function save(idx: UserIndex, user?: SessionUser) {
  if (user) {
    idx.email = user.email ?? idx.email;
    idx.name = user.name ?? idx.name;
    idx.image = user.image ?? idx.image;
  }
  idx.updatedAt = new Date().toISOString();
  await writeJSON(userPath(idx.id), idx);
}

export async function addBookToUser(user: SessionUser, bookId: string) {
  const idx = await getUserIndex(user);
  if (!idx.books.includes(bookId)) idx.books.unshift(bookId);
  await save(idx, user);
}

export async function removeBookFromUser(userId: string, bookId: string) {
  const idx = await readJSON<UserIndex>(userPath(userId));
  if (!idx) return;
  idx.books = idx.books.filter((b) => b !== bookId);
  await save(idx);
}
