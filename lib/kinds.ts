import type { Accent, MomentKind } from "./types";

export const KINDS: { id: MomentKind; label: string; plural: string }[] = [
  { id: "first", label: "A first", plural: "Firsts" },
  { id: "milestone", label: "Milestone", plural: "Milestones" },
  { id: "growth", label: "Growth & health", plural: "Growth" },
  { id: "everyday", label: "Everyday", plural: "Everyday" },
  { id: "celebration", label: "Celebration", plural: "Celebrations" },
  { id: "friend", label: "From a friend", plural: "From friends" },
];

export const kindLabel = (k: MomentKind) => KINDS.find((x) => x.id === k)?.label ?? k;

export const ACCENTS: { id: Accent; name: string; hex: string; deep: string; soft: string }[] = [
  { id: "bubblegum", name: "Bubblegum", hex: "#FF5C8A", deep: "#C2185B", soft: "#FFE1EA" },
  { id: "mint", name: "Mint", hex: "#22C7A0", deep: "#0E7C66", soft: "#D5F7EE" },
  { id: "sunshine", name: "Sunshine", hex: "#FFB627", deep: "#A86400", soft: "#FFF0CC" },
  { id: "lilac", name: "Lilac", hex: "#8C6CFF", deep: "#5136C7", soft: "#E9E2FF" },
  { id: "sky", name: "Sky", hex: "#2FA8FF", deep: "#0B67AD", soft: "#D9EFFF" },
];

export const accentOf = (a: Accent | string | undefined) =>
  ACCENTS.find((x) => x.id === a) ?? ACCENTS[0];

export const isAccent = (a: unknown): a is Accent => ACCENTS.some((x) => x.id === a);
export const isKind = (k: unknown): k is MomentKind => KINDS.some((x) => x.id === k);
