// In-game calendar. The clock is stored in the save as minutes since the
// adventure began (`S.clock`), so the date and weekday survive reloads.
// Day 0 is Monday 1 March; a new adventure starts at 8:00.
//
// Events ask the calendar instead of the PC clock, for example:
//   if (isDay('martes', 'jueves')) { ...feria abierta... }
//   if (daysSince(S.flags... start day) < 2) { ...fiesta de 2 días... }
import { state } from './state.ts';
import { setClockSource } from '../gfx/screen.ts';

/** Real milliseconds per in-game minute: a full day lasts 18 real minutes. */
export const MS_PER_MINUTE = 750;
export const START_MINUTE = 8 * 60;
const DAY = 24 * 60;

export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
// 1 March 2027 is a Monday, so real month lengths line up with WEEKDAYS (day 0 = lunes).
const EPOCH = Date.UTC(2027, 2, 1);

/** Minutes since the adventure began (falls back to the start time before a game is loaded). */
export function clockMinutes(S = state()) {
  const m = S?.clock;
  return Number.isFinite(m) && m >= 0 ? m : START_MINUTE;
}

/** Called every frame while playing. */
export function advanceClock(dtMs: number) {
  const S = state();
  if (!S) return;
  S.clock = clockMinutes(S) + dtMs / MS_PER_MINUTE;
}

/** Days since the adventure began (0 = first day). */
export const dayNumber = (m = clockMinutes()) => Math.floor(m / DAY);
/** Hour of the day 0..24 (fractional). */
export const hourOfDay = (m = clockMinutes()) => (m % DAY) / 60;
/** 0 = lunes … 6 = domingo. */
export const weekdayIndex = (m = clockMinutes()) => dayNumber(m) % 7;
export const weekday = (m = clockMinutes()): Weekday => WEEKDAYS[weekdayIndex(m)];

/** True when today is any of the given weekdays ('martes', 'jueves', ...; accents optional). */
export function isDay(...days: string[]) {
  const today = norm(weekday());
  return days.some((d) => norm(d) === today);
}
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Whole days elapsed since an earlier day number (e.g. stored when an event began). */
export const daysSince = (day: number) => dayNumber() - day;

/** True between two hours of the day, e.g. isHourBetween(18, 23); wraps past midnight when from > to. */
export function isHourBetween(from: number, to: number) {
  const h = hourOfDay();
  return from <= to ? h >= from && h < to : h >= from || h < to;
}

export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "2 de marzo" */
export function dateText(m = clockMinutes()) {
  const d = new Date(EPOCH + dayNumber(m) * 86400000);
  return `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}
/** "14:20" */
export function timeText(m = clockMinutes()) {
  const t = Math.floor(m % DAY);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
/** "Martes 2 de marzo · 14:20" */
export const fullText = (m = clockMinutes()) => `${capital(weekday(m))} ${dateText(m)} · ${timeText(m)}`;
/** "Mié 22 set · 14:20" (narrow screens) */
export function shortText(m = clockMinutes()) {
  const d = new Date(EPOCH + dayNumber(m) * 86400000);
  return `${capital(weekday(m).slice(0, 3))} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} · ${timeText(m)}`;
}
export const isNight = (m = clockMinutes()) => { const h = hourOfDay(m); return h >= 20 || h < 6; };

/** Jump the clock to the next morning at `hour` (same day if it is still before dawn). */
export function sleepUntil(hour = 8) {
  const S = state();
  if (!S) return;
  const m = clockMinutes(S);
  let target = dayNumber(m) * DAY + hour * 60;
  if (hourOfDay(m) >= 5 || target <= m) target += DAY;
  S.clock = target;
}

// The sky (day/night tint, night encounters) follows the saved calendar once a game is running.
setClockSource(() => (state() ? hourOfDay() : null));
