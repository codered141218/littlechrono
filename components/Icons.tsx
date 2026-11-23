import type { MomentKind } from "@/lib/types";

type P = { size?: number; className?: string };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const PlusIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>
);
export const PlayIcon = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor"><path d="M7 4.5v15l12.5-7.5z" /></svg>
);
export const PauseIcon = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><rect x="6" y="4.5" width="4" height="15" rx="1.2" /><rect x="14" y="4.5" width="4" height="15" rx="1.2" /></svg>
);
export const CloseIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ShareIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
);
export const GearIcon = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const CameraIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const StarIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
);
export const ChevronIcon = ({ size, dir = "right" }: P & { dir?: "left" | "right" }) => (
  <svg {...base(size)} style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}><path d="M9 5l7 7-7 7" /></svg>
);

export function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden>
      <path d="M2 9c8 5 20 5 28 0" fill="none" stroke="#26134d" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="6" y="9" width="9" height="12" rx="2.5" fill="#FF5C8A" stroke="#26134d" strokeWidth="2.2" transform="rotate(-6 10 15)" />
      <rect x="17" y="10" width="9" height="15" rx="2.5" fill="#FFB627" stroke="#26134d" strokeWidth="2.2" transform="rotate(5 21 17)" />
    </svg>
  );
}

/** Chunky sticker doodles for moments without photos. */
export function Doodle({ kind, seed = 0 }: { kind: MomentKind; seed?: number }) {
  const s = { stroke: "#26134d", strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const variant = (kind === "everyday" ? ["moon", "sock", "bottle"] : kind === "first" ? ["tooth", "foot", "sun"] : [])[seed % 3];
  const shape = variant ?? kind;
  switch (shape) {
    case "milestone":
    case "foot":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M40 30c14-2 24 10 24 30s-8 32-20 32-18-10-16-26 0-34 12-36z" />
          {[[38, 14, 7], [52, 12, 6], [63, 18, 5], [70, 27, 4.5], [27, 22, 6]].map(([cx, cy, r], i) => (
            <circle key={i} {...s} strokeWidth={4} fill="#fff" cx={cx} cy={cy} r={r} />
          ))}
        </svg>
      );
    case "growth":
    case "bottle":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M38 30h24v8c6 4 8 10 8 16v30a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V54c0-6 2-12 8-16z" />
          <path {...s} fill="#FFB627" d="M42 30v-8c0-4 4-10 8-10s8 6 8 10v8z" />
          <path {...s} strokeWidth={4} d="M38 56h10M38 68h14M38 80h10" />
        </svg>
      );
    case "celebration":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M18 54h64v34H18z" />
          <path {...s} fill="#FFB627" d="M18 54c8 8 16-8 22 0s14-8 20 0 14-8 22 0" />
          <path {...s} d="M36 54V38M50 54V34M64 54V38" />
          <path {...s} fill="#FFB627" d="M36 30c-3-4 0-8 0-8s3 4 0 8zM50 26c-3-4 0-8 0-8s3 4 0 8zM64 30c-3-4 0-8 0-8s3 4 0 8z" />
        </svg>
      );
    case "tooth":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M28 20c8-6 16 0 22 0s14-6 22 0 6 22 2 32-4 34-12 34-6-20-12-20-4 20-12 20-8-24-12-34-6-26 2-32z" />
          <path {...s} strokeWidth={4} d="M40 30c4 2 8 2 10 0" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle {...s} fill="#FFB627" cx="50" cy="50" r="20" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <path key={i} {...s} d={`M${50 + Math.cos(a) * 30} ${50 + Math.sin(a) * 30}L${50 + Math.cos(a) * 42} ${50 + Math.sin(a) * 42}`} />;
          })}
        </svg>
      );
    case "sock":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M40 12h26v44c0 10-6 18-16 24l-10 6c-10 6-22-8-12-16l12-10z" />
          <path {...s} fill="#FFB627" d="M40 12h26v12H40z" />
        </svg>
      );
    case "friend":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M50 84S16 64 16 40c0-12 9-20 19-20 7 0 12 4 15 9 3-5 8-9 15-9 10 0 19 8 19 20 0 24-34 44-34 44z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <path {...s} fill="#fff" d="M62 14a36 36 0 1 0 24 52A30 30 0 0 1 62 14z" />
          <circle {...s} strokeWidth={4} fill="#FFB627" cx="74" cy="26" r="3" />
        </svg>
      );
  }
}

export function StarBurst({ label = "Big moment" }: { label?: string }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 ? 40 : 48;
    const a = (i / 24) * Math.PI * 2;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <svg className="star-badge" viewBox="0 0 100 100" role="img" aria-label={label}>
      <polygon points={pts} fill="#FFB627" stroke="#26134d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 30l5.6 11.6 12.8 1.8-9.2 9 2.2 12.6L50 59l-11.4 6 2.2-12.6-9.2-9 12.8-1.8z" fill="#26134d" />
    </svg>
  );
}
