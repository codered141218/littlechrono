import type { Moment } from "./types";

export const byChronologyClient = (a: Moment, b: Moment) =>
  a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date);
