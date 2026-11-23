import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import type { Book } from "./types";

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export function keyMatches(book: Book, key: string | null | undefined): boolean {
  if (!key) return false;
  const a = Buffer.from(hashKey(key), "hex");
  const b = Buffer.from(book.keyHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const keyFrom = (req: Request) => req.headers.get("x-parent-key");

/** Google sign-in is switched on once its credentials are configured. */
export const authEnabled = () =>
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET);

export interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

export async function currentUser(): Promise<SessionUser | null> {
  if (!authEnabled()) return null;
  try {
    const { auth } = await import("@/auth");
    const s = await auth();
    const u = s?.user;
    if (!u?.id) return null;
    return { id: u.id, name: u.name ?? undefined, email: u.email ?? undefined, image: u.image ?? undefined };
  } catch {
    return null;
  }
}

export const isOwner = (book: Book, user: SessionUser | null) =>
  Boolean(user && book.ownerIds?.includes(user.id));

/** Parents can edit with a signed-in account that owns the timeline, or with the parent link key. */
export async function canEdit(book: Book, key: string | null | undefined): Promise<boolean> {
  if (keyMatches(book, key)) return true;
  return isOwner(book, await currentUser());
}
