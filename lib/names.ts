import type { BirthDetails, PublicBook } from "./types";

/** The short name used in headlines and sentences: nickname, else first name. */
export const nameOf = (b: Pick<PublicBook, "name" | "nickname">) =>
  b.nickname?.trim() || b.name.trim().split(/\s+/)[0] || b.name;

const trimNum = (n: number, digits: number) => String(Number(n.toFixed(digits)));

export function formatWeight(grams: number, unit: "kg" | "lb" = "kg") {
  const kg = `${trimNum(grams / 1000, 2)} kg`;
  const totalOz = grams / 28.349523125;
  let lb = Math.floor(totalOz / 16);
  let oz = Math.round(totalOz - lb * 16);
  if (oz === 16) {
    lb += 1;
    oz = 0;
  }
  const imperial = `${lb} lb${oz ? ` ${oz} oz` : ""}`;
  return unit === "lb" ? { main: imperial, alt: kg } : { main: kg, alt: imperial };
}

export function formatLength(cm: number, unit: "cm" | "in" = "cm") {
  const metric = `${trimNum(cm, 1)} cm`;
  const imperial = `${trimNum(cm / 2.54, 1)} in`;
  return unit === "in" ? { main: imperial, alt: metric } : { main: metric, alt: imperial };
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "Born at 4:12 AM, weighing 3.2 kg (7 lb 1 oz) and 50 cm long. Delivered by Dr. Santos at St. Luke's." */
export function birthSentence(b: { birth?: BirthDetails }) {
  const d = b.birth ?? {};
  const parts: string[] = [];
  let first = "Born";
  if (d.time) first += ` at ${formatTime(d.time)}`;
  const size: string[] = [];
  if (d.weightGrams) {
    const w = formatWeight(d.weightGrams, d.weightUnit);
    size.push(`weighing ${w.main} (${w.alt})`);
  }
  if (d.lengthCm) size.push(`${formatLength(d.lengthCm, d.lengthUnit).main} long`);
  if (d.time || size.length) parts.push(`${first}${size.length ? `, ${size.join(" and ")}` : ""}.`);
  if (d.doctor || d.place) {
    parts.push(
      `${d.doctor ? `Delivered by ${d.doctor}` : "Born"}${d.place ? ` at ${d.place}` : ""}.`,
    );
  }
  return parts.join(" ");
}
