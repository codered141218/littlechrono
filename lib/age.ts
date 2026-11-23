/** All dates are plain calendar days (YYYY-MM-DD); math is done in UTC to avoid timezone drift. */

const toUTC = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const parts = (s: string) => s.split("-").map(Number) as [number, number, number];

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const daysBetween = (from: string, to: string) =>
  Math.round((toUTC(to) - toUTC(from)) / 86_400_000);

export function monthsBetween(from: string, to: string) {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** "3 weeks old", "Birth day", "8 weeks before birth" */
export function ageLabel(birth: string, date: string): string {
  const d = daysBetween(birth, date);
  if (d < 0) {
    const w = Math.round(-d / 7);
    return w >= 1 ? `${plural(w, "week")} before birth` : `${plural(-d, "day")} before birth`;
  }
  if (d === 0) return "Birth day";
  if (d < 14) return `${plural(d, "day")} old`;
  const m = monthsBetween(birth, date);
  if (m < 2) return `${plural(Math.floor(d / 7), "week")} old`;
  if (m < 24) return `${plural(m, "month")} old`;
  const y = Math.floor(m / 12);
  const rem = m % 12;
  return `${plural(y, "year")}${rem ? `, ${plural(rem, "month")}` : ""} old`;
}

export interface Chapter {
  key: string;
  order: number;
  big: string;
  small: string;
}

export function chapterOf(birth: string, date: string): Chapter {
  const d = daysBetween(birth, date);
  if (d < 0) return { key: "bump", order: -1, big: "Bump", small: "before you arrived" };
  const m = monthsBetween(birth, date);
  if (m < 1) return { key: "m0", order: 0, big: "Newborn", small: "the first month" };
  if (m < 24) return { key: `m${m}`, order: m, big: String(m), small: m === 1 ? "month old" : "months old" };
  const y = Math.floor(m / 12);
  return { key: `y${y}`, order: y * 12, big: String(y), small: "years old" };
}

export function formatDate(s: string, opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }) {
  const [y, m, d] = parts(s);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

export interface LiveAge {
  unborn: boolean;
  headline: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Age right now, counted from local midnight of the birth date. */
export function liveAge(birth: string, now: Date): LiveAge {
  const [y, m, d] = parts(birth);
  const born = new Date(y, m - 1, d).getTime();
  let ms = now.getTime() - born;
  const unborn = ms < 0;
  ms = Math.abs(ms);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor(ms / 3_600_000) % 24;
  const minutes = Math.floor(ms / 60_000) % 60;
  const seconds = Math.floor(ms / 1000) % 60;

  let headline: string;
  if (unborn) {
    headline = days === 0 ? "Arriving today" : `Arriving in ${plural(days + 1, "day")}`;
  } else {
    const today = toISODate(now);
    const months = monthsBetween(birth, today);
    if (days < 14) headline = days === 0 ? "Born today" : `${plural(days, "day")} old`;
    else if (months < 2) {
      const w = Math.floor(days / 7);
      const r = days % 7;
      headline = `${plural(w, "week")}${r ? `, ${plural(r, "day")}` : ""} old`;
    } else if (months < 24) {
      const [by, bm, bd] = parts(birth);
      const anchor = new Date(by, bm - 1 + months, bd);
      const extra = Math.floor((now.getTime() - anchor.getTime()) / (7 * 86_400_000));
      headline = `${plural(months, "month")}${extra > 0 ? `, ${plural(extra, "week")}` : ""} old`;
    } else {
      const yrs = Math.floor(months / 12);
      const r = months % 12;
      headline = `${plural(yrs, "year")}${r ? `, ${plural(r, "month")}` : ""} old`;
    }
  }
  return { unborn, headline, days, hours, minutes, seconds };
}

/** "Maya was 3 months old", "Maya was born that day", "That's 8 weeks before birth" */
export function agePhrase(name: string, birth: string, date: string) {
  const label = ageLabel(birth, date);
  if (label === "Birth day") return `${name} was born that day`;
  if (label.includes("before birth")) return `That's ${label}`;
  return `${name} was ${label}`;
}
