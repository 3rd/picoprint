const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export const formatRelativeTime = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const absDiffMs = Math.abs(diffMs);

  const seconds = Math.floor(absDiffMs / MILLISECONDS_PER_SECOND);
  if (seconds === 0) return "just now";

  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const days = Math.floor(hours / HOURS_PER_DAY);
  const weeks = Math.floor(days / DAYS_PER_WEEK);
  const months = Math.floor(days / DAYS_PER_MONTH);
  const years = Math.floor(days / DAYS_PER_YEAR);

  const getTimeUnit = (value: number, singular: string, plural: string) => (value === 1 ? singular : plural);

  let relative: string;
  if (years > 0) {
    relative = getTimeUnit(years, "1 year", `${years} years`);
  } else if (months > 0) {
    relative = getTimeUnit(months, "1 month", `${months} months`);
  } else if (weeks > 0) {
    relative = getTimeUnit(weeks, "1 week", `${weeks} weeks`);
  } else if (days > 0) {
    relative = getTimeUnit(days, "1 day", `${days} days`);
  } else if (hours > 0) {
    relative = getTimeUnit(hours, "1 hour", `${hours} hours`);
  } else if (minutes > 0) {
    relative = getTimeUnit(minutes, "1 minute", `${minutes} minutes`);
  } else {
    relative = getTimeUnit(seconds, "1 second", `${seconds} seconds`);
  }

  return diffMs < 0 ? `in ${relative}` : `${relative} ago`;
};
