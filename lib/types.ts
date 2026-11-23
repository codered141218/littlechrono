export type Accent = "bubblegum" | "mint" | "sunshine" | "lilac" | "sky";

export type MomentKind =
  | "first"
  | "milestone"
  | "growth"
  | "everyday"
  | "celebration"
  | "friend";

export interface Photo {
  /** Storage pathname, served through /api/media/<path> */
  path: string;
  w: number;
  h: number;
}

export interface Book {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  birthDate: string;
  accent: Accent;
  coverPhoto?: Photo | null;
  allowFriends: boolean;
  createdAt: string;
  updatedAt: string;
  keyHash: string;
}

export type PublicBook = Omit<Book, "keyHash">;

export interface Moment {
  id: string;
  bookId: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
  kind: MomentKind;
  star?: boolean;
  photos: Photo[];
  author: { role: "parent" | "friend"; name?: string };
  createdAt: string;
  updatedAt: string;
}

export interface BookPayload {
  book: PublicBook;
  moments: Moment[];
}

export type StorageInfo =
  | { mode: "blob"; access: "public" | "private" }
  | { mode: "local" };
