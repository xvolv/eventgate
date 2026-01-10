import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toValidDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const addisTimeZone = "Africa/Addis_Ababa";

export function formatWesternAddisDateTime(input: string | Date) {
  const d = toValidDate(input);
  if (!d) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: addisTimeZone,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatEthiopianClockTime(input: string | Date) {
  const d = toValidDate(input);
  if (!d) return "Invalid date";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: addisTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const hourPart = parts.find((p) => p.type === "hour")?.value;
  const minutePart = parts.find((p) => p.type === "minute")?.value;

  const westernHour = hourPart ? parseInt(hourPart, 10) : NaN;
  const minute = minutePart ? parseInt(minutePart, 10) : NaN;

  if (Number.isNaN(westernHour) || Number.isNaN(minute)) return "Invalid date";

  const ethiopianHour24 = (westernHour + 24 - 6) % 24;
  const ethiopianHour12 =
    ethiopianHour24 % 12 === 0 ? 12 : ethiopianHour24 % 12;
  const label = westernHour >= 6 && westernHour < 18 ? "day" : "night";

  const minuteStr = String(minute).padStart(2, "0");
  return `${ethiopianHour12}:${minuteStr} ${label}`;
}

export function formatDualTimeRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
) {
  if (!start || !end) {
    return {
      western: "Not specified",
      ethiopian: "",
    };
  }

  return {
    western: `${formatWesternAddisDateTime(
      start
    )} - ${formatWesternAddisDateTime(end)}`,
    ethiopian: `${formatEthiopianClockTime(start)} - ${formatEthiopianClockTime(
      end
    )}`,
  };
}
