"use client";
import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({
  value, min = 1, max, onChange, label,
}: { value: number; min?: number; max: number; onChange: (v: number) => void; label: string }) {
  const btn = "flex h-9 w-9 items-center justify-center text-ink hover:bg-sand disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-control border border-line bg-surface">
      <button type="button" className={`${btn} rounded-l-control`} aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}><Minus aria-hidden className="h-4 w-4" /></button>
      <span aria-live="polite" className="w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" className={`${btn} rounded-r-control`} aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}><Plus aria-hidden className="h-4 w-4" /></button>
    </div>
  );
}
