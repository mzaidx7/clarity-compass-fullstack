import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Clamp a number between min and max
export function clamp(x: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, x));
}

// Round for UI display (whole number) while allowing a raw value with fixed decimals
export function roundDisplay(x: number) {
  return Math.round(x);
}

export type RiskLevel = "Low" | "Moderate" | "High";

export function scoreToLevel(score: number): RiskLevel {
  const s = clamp(score);
  if (s < 33) return "Low";
  if (s <= 66) return "Moderate";
  return "High";
}

export function levelToColor(level: RiskLevel) {
  switch (level) {
    case "Low":
      return { text: "text-green-400", ring: "bg-green-500", bg: "bg-green-500" };
    case "Moderate":
      return { text: "text-yellow-400", ring: "bg-yellow-500", bg: "bg-yellow-500" };
    case "High":
    default:
      return { text: "text-red-400", ring: "bg-red-500", bg: "bg-red-500" };
  }
}

// Convert a date or ISO string to a local day key YYYY-MM-DD
export function toLocalDayKey(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : new Date(d);
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
