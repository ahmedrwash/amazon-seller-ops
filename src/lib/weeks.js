// Amazon-aligned week helpers. Amazon Seller Central reports use
// Sunday → Saturday weeks, so we match that here (NOT ISO Monday weeks).
// Source of truth for a stored week = { year, week, period_start, period_end }.

const MS_DAY = 86400000;

function atMidnight(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Sunday (00:00) of the week containing `date`. */
export function startOfWeek(date) {
  const d = atMidnight(date);
  d.setDate(d.getDate() - d.getDay()); // getDay(): 0 = Sunday
  return d;
}

/** Saturday of the week containing `date`. */
export function endOfWeek(date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return e;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** First Sunday-week start of a given year (the week that contains Jan 1). */
function firstWeekStart(year) {
  return startOfWeek(new Date(year, 0, 1));
}

/**
 * Amazon-style week descriptor for a date.
 * year/week are assigned by the week's Sunday (period_start).
 */
export function amazonWeek(date) {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const year = start.getFullYear();
  const week = Math.floor((start - firstWeekStart(year)) / (7 * MS_DAY)) + 1;
  return {
    year,
    week,
    period_start: toISODate(start),
    period_end: toISODate(end),
    start,
    end,
    value: `${year}-${week}`,
    label: `Week ${week} · ${formatRange(start, end)}`,
  };
}

/** Reconstruct the date range for a stored (year, week). Inverse of amazonWeek. */
export function datesForWeek(year, week) {
  const start = addDays(firstWeekStart(year), (week - 1) * 7);
  const end = addDays(start, 6);
  return { start, end, period_start: toISODate(start), period_end: toISODate(end) };
}

/** Parse a "YYYY-WW" selector value → { year, week, ...dates }. */
export function parseWeekValue(value) {
  if (!value) return null;
  const [y, w] = value.split('-').map(Number);
  if (!y || !w) return null;
  return { year: y, week: w, ...datesForWeek(y, w) };
}

/** YYYY-MM-DD (local). */
export function toISODate(d) {
  const x = atMidnight(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Jun 14–20, 2026" (or "Jun 28 – Jul 4, 2026" across months). */
export function formatRange(start, end) {
  const s = new Date(start), e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`;
  const sameYear = s.getFullYear() === e.getFullYear();
  const left = `${MONTHS[s.getMonth()]} ${s.getDate()}`;
  const right = `${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  return sameYear ? `${left} – ${right}` : `${left}, ${s.getFullYear()} – ${right}`;
}

/** The current Amazon week. */
export function currentWeek() {
  return amazonWeek(new Date());
}

/** Recent weeks (most recent first) for selectors. */
export function weekOptions(count = 12) {
  const out = [];
  let cursor = startOfWeek(new Date());
  for (let i = 0; i < count; i++) {
    const w = amazonWeek(cursor);
    out.push({ value: w.value, year: w.year, week: w.week, start: w.start, end: w.end, label: w.label });
    cursor = addDays(cursor, -7);
  }
  return out;
}
