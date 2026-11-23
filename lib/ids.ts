import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijkmnpqrstuvwxyz";
export const newBookId = customAlphabet(alphabet, 12);
export const newMomentId = customAlphabet(alphabet, 14);
export const newKey = customAlphabet(
  "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz",
  32,
);

export const isBookId = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-z]{12}$/.test(s);
export const isMomentId = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-z]{14}$/.test(s);
