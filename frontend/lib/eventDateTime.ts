import { format, parseISO } from 'date-fns';

const TIME_RE = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export function isWallTimeString(s?: string | null): boolean {
  return Boolean(s && TIME_RE.test(s));
}

/**
 * Calendar events store `startDate` as an ISO instant and often a separate `startTime` ("HH:mm")
 * wall-clock. Merge using the **local** calendar date from that instant + the wall time so
 * FullCalendar and labels match what users picked in the browser.
 */
export function mergeLocalDateFromIsoWithTime(iso: string, timeHHmm?: string | null): Date {
  const parsed = parseISO(iso);
  const y = parsed.getFullYear();
  const mo = parsed.getMonth();
  const d = parsed.getDate();
  if (timeHHmm && TIME_RE.test(timeHHmm)) {
    const [hh, mm] = timeHHmm.split(':').map((x) => parseInt(x, 10));
    return new Date(y, mo, d, hh, mm, 0, 0);
  }
  return parsed;
}

/** Build UTC ISO from dashboard date (yyyy-mm-dd) + optional time from `<input type="time">`. */
export function combineFormDateAndTimeToIso(dateStr: string, timeStr?: string | null): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return parseISO(dateStr).toISOString();
  }
  const [y, mo, d] = parts;
  let hh = 0;
  let mm = 0;
  if (timeStr && TIME_RE.test(timeStr)) {
    const t = timeStr.split(':').map((x) => parseInt(x, 10));
    hh = t[0];
    mm = t[1];
  }
  return new Date(y, mo - 1, d, hh, mm, 0, 0).toISOString();
}

export function formatEventDateTimeLabel(
  startDateIso: string,
  startTime?: string | null,
  allDay?: boolean | null
): string {
  if (allDay) {
    const start = mergeLocalDateFromIsoWithTime(startDateIso, null);
    return format(start, 'PPP');
  }
  const when = mergeLocalDateFromIsoWithTime(startDateIso, startTime);
  return format(when, 'PPp');
}
