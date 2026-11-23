"use client";
import type { BirthDetails, PublicBook, Sex } from "@/lib/types";

export interface BirthForm {
  nickname: string;
  sex: Sex | null;
  time: string;
  weightUnit: "kg" | "lb";
  kg: string;
  lb: string;
  oz: string;
  lengthUnit: "cm" | "in";
  length: string;
  doctor: string;
  place: string;
}

const OZ = 28.349523125;

export function emptyBirthForm(): BirthForm {
  return { nickname: "", sex: null, time: "", weightUnit: "kg", kg: "", lb: "", oz: "", lengthUnit: "cm", length: "", doctor: "", place: "" };
}

export function birthFormFrom(b: Partial<PublicBook>): BirthForm {
  const d = b.birth ?? {};
  const f = emptyBirthForm();
  f.nickname = b.nickname ?? "";
  f.sex = b.sex ?? null;
  f.time = d.time ?? "";
  f.weightUnit = d.weightUnit ?? "kg";
  f.lengthUnit = d.lengthUnit ?? "cm";
  if (d.weightGrams) {
    f.kg = String(Number((d.weightGrams / 1000).toFixed(2)));
    const totalOz = d.weightGrams / OZ;
    const lb = Math.floor(totalOz / 16);
    f.lb = String(lb);
    f.oz = String(Number((totalOz - lb * 16).toFixed(1)));
  }
  if (d.lengthCm) f.length = String(f.lengthUnit === "in" ? Number((d.lengthCm / 2.54).toFixed(1)) : d.lengthCm);
  f.doctor = d.doctor ?? "";
  f.place = d.place ?? "";
  return f;
}

export function birthPayload(f: BirthForm): { nickname: string; sex: Sex | null; birth: BirthDetails } {
  let weightGrams: number | undefined;
  if (f.weightUnit === "kg" && f.kg) weightGrams = parseFloat(f.kg) * 1000;
  if (f.weightUnit === "lb" && (f.lb || f.oz)) weightGrams = ((parseFloat(f.lb) || 0) * 16 + (parseFloat(f.oz) || 0)) * OZ;
  let lengthCm: number | undefined;
  if (f.length) lengthCm = parseFloat(f.length) * (f.lengthUnit === "in" ? 2.54 : 1);
  return {
    nickname: f.nickname.trim(),
    sex: f.sex,
    birth: {
      time: f.time || undefined,
      weightGrams: weightGrams && Number.isFinite(weightGrams) ? Math.round(weightGrams) : undefined,
      weightUnit: f.weightUnit,
      lengthCm: lengthCm && Number.isFinite(lengthCm) ? lengthCm : undefined,
      lengthUnit: f.lengthUnit,
      doctor: f.doctor.trim() || undefined,
      place: f.place.trim() || undefined,
    },
  };
}

function Units<T extends string>({ value, options, onChange, label }: { value: T; options: T[]; onChange: (v: T) => void; label: string }) {
  return (
    <span className="units" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o} aria-pressed={value === o} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </span>
  );
}

export function BirthFields({
  value: f,
  onChange,
  unborn,
}: {
  value: BirthForm;
  onChange: (f: BirthForm) => void;
  unborn?: boolean;
}) {
  const set = (p: Partial<BirthForm>) => onChange({ ...f, ...p });
  return (
    <>
      <label className="field">
        <span>Nickname (optional)</span>
        <input className="input" value={f.nickname} maxLength={30} placeholder="What you call her or him" onChange={(e) => set({ nickname: e.target.value })} />
        <span className="hint">Used in the big headline. Leave it empty to use the first name.</span>
      </label>

      <div className="field">
        <span className="label">{unborn ? "It's a…" : "Baby is a…"}</span>
        <div className="pills">
          {(["girl", "boy"] as const).map((s) => (
            <button type="button" key={s} className="pill" aria-pressed={f.sex === s} onClick={() => set({ sex: f.sex === s ? null : s })}>
              {s === "girl" ? "Girl" : "Boy"}
            </button>
          ))}
          {unborn && (
            <button type="button" className="pill" aria-pressed={f.sex === null} onClick={() => set({ sex: null })}>
              It&apos;s a surprise
            </button>
          )}
        </div>
      </div>

      {!unborn && (
        <>
          <div className="row">
            <label className="field">
              <span>Time of birth</span>
              <input className="input" type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} />
            </label>
            <div className="field">
              <span className="label unit-label">
                Weight <Units label="Weight unit" value={f.weightUnit} options={["kg", "lb"]} onChange={(weightUnit) => set({ weightUnit })} />
              </span>
              {f.weightUnit === "kg" ? (
                <input className="input" inputMode="decimal" value={f.kg} placeholder="3.2" onChange={(e) => set({ kg: e.target.value.replace(/[^\d.]/g, "") })} />
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <input className="input" inputMode="numeric" value={f.lb} placeholder="7 lb" aria-label="Pounds" onChange={(e) => set({ lb: e.target.value.replace(/[^\d]/g, "") })} />
                  <input className="input" inputMode="decimal" value={f.oz} placeholder="1 oz" aria-label="Ounces" onChange={(e) => set({ oz: e.target.value.replace(/[^\d.]/g, "") })} />
                </div>
              )}
            </div>
          </div>
          <div className="row">
            <div className="field">
              <span className="label unit-label">
                Length <Units label="Length unit" value={f.lengthUnit} options={["cm", "in"]} onChange={(lengthUnit) => set({ lengthUnit })} />
              </span>
              <input className="input" inputMode="decimal" value={f.length} placeholder={f.lengthUnit === "cm" ? "50" : "19.5"} onChange={(e) => set({ length: e.target.value.replace(/[^\d.]/g, "") })} />
            </div>
            <label className="field">
              <span>Doctor</span>
              <input className="input" value={f.doctor} maxLength={60} placeholder="Dr. Santos" onChange={(e) => set({ doctor: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>Place of birth</span>
            <input className="input" value={f.place} maxLength={80} placeholder="St. Luke's Medical Center" onChange={(e) => set({ place: e.target.value })} />
          </label>
        </>
      )}
    </>
  );
}
