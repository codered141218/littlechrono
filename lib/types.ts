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

export type Sex = "girl" | "boy";

export interface BirthDetails {
  /** HH:MM, 24h */
  time?: string;
  weightGrams?: number;
  weightUnit?: "kg" | "lb";
  lengthCm?: number;
  lengthUnit?: "cm" | "in";
  doctor?: string;
  place?: string;
}

export interface Book {
  id: string;
  /** Full name */
  name: string;
  /** What the family calls the baby; used in headlines */
  nickname?: string;
  sex?: Sex | null;
  birth?: BirthDetails;
  /** Google account ids (token.sub) of parents who can manage this timeline */
  ownerIds?: string[];
  /** YYYY-MM-DD */
  birthDate: string;
  accent: Accent;
  coverPhoto?: Photo | null;
  allowFriends: boolean;
  createdAt: string;
  updatedAt: string;
  keyHash: string;
}

export type PublicBook = Omit<Book, "keyHash" | "ownerIds">;

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

export interface UserIndex {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  books: string[];
  updatedAt: string;
}

export interface Me {
  authEnabled: boolean;
  user: { id: string; name?: string; email?: string; image?: string } | null;
  books: (PublicBook & { momentCount: number })[];
}
