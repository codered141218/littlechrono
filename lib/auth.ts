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
