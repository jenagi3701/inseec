// Demo dates are generated relative to "today" so the prototype always has
// upcoming and past activities, whenever it is launched.

const DAY = 24 * 60 * 60 * 1000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Next occurrence of a weekday (0 = dimanche … 6 = samedi), plus N extra weeks. */
export function onWeekday(weekday: number, extraWeeks: number, hour: number, minute = 0): string {
  const d = startOfToday();
  let delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0) delta = 7; // never "today", keeps the demo stable during the day
  d.setTime(d.getTime() + (delta + extraWeeks * 7) * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysAgo(days: number, hour: number, minute = 0): string {
  const d = startOfToday();
  d.setTime(d.getTime() - days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
