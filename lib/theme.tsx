import { accentOf } from "./kinds";
import type { Accent } from "./types";

/** Server-rendered theme so the page paints in the baby's color before JS runs. */
export function ThemeStyle({ accent }: { accent: Accent }) {
  const a = accentOf(accent);
  return <style>{`:root{--accent:${a.hex};--accent-deep:${a.deep};--accent-soft:${a.soft}}`}</style>;
}
