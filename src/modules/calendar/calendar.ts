import type { CalendarEvent, CalendarOptions } from "./types";
import { assertForegroundColorOption, colors } from "../../utils/colors";
import { drawHorizontalLine } from "../../utils/line-styles";
import {
  assertBooleanOption,
  assertPlainOptionsObject,
  isOptionsObject,
  isPlainRecord,
} from "../../utils/options";
import { renderAndReturn, write } from "../../utils/writer";
import { resolveRenderContext } from "../context";

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const getSeparator = (width: number) => drawHorizontalLine(Math.max(1, width));
const SUNDAY = 0;
const SATURDAY = 6;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const monthNamesShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const dayNamesMin = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const getWeekNumber = (date: Date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / MILLISECONDS_PER_DAY;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / DAYS_PER_WEEK);
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === SUNDAY || day === SATURDAY;
};

const formatDate = (date: Date, format = "YYYY-MM-DD") => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return format
    .replace("YYYY", year.toString())
    .replace("MM", month)
    .replace("DD", day)
    .replace("MMM", monthNamesShort[date.getMonth()] || "")
    .replace("MMMM", monthNames[date.getMonth()] || "");
};

const PRIORITY_ICONS: Partial<Record<string, string>> = { high: "🔥", medium: "⚡" };
const EVENT_PRIORITIES = ["high", "low", "medium"] as const;

const assertCalendarDate = (value: unknown, optionName: string) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError(`picoprint ${optionName} must be a valid Date`);
  }
};

const validateCalendarOptions = (date: unknown, options: CalendarOptions) => {
  assertCalendarDate(date, "calendar date");
  assertPlainOptionsObject(options as unknown, "calendar options");

  if (
    options.firstDayOfWeek !== undefined &&
    (!Number.isInteger(options.firstDayOfWeek) || options.firstDayOfWeek < 0 || options.firstDayOfWeek > 6)
  ) {
    throw new RangeError("picoprint firstDayOfWeek must be an integer from 0 to 6");
  }

  if (options.events !== undefined && !Array.isArray(options.events)) {
    throw new TypeError("picoprint events must be an array");
  }

  assertBooleanOption(options.showWeekNumbers, "showWeekNumbers");
  assertBooleanOption(options.highlightToday, "highlightToday");
  assertBooleanOption(options.highlightWeekends, "highlightWeekends");
  assertBooleanOption(options.showHeader, "showHeader");
  assertBooleanOption(options.showFooter, "showFooter");

  for (const [index, event] of (options.events ?? []).entries()) {
    if (!isPlainRecord(event)) {
      throw new TypeError(`picoprint events[${index}] must be an object`);
    }
    assertCalendarDate(event.date, `events[${index}].date`);
    if (typeof event.label !== "string") {
      throw new TypeError(`picoprint events[${index}].label must be a string`);
    }
    assertForegroundColorOption(event.color, `events[${index}].color`);
    const priority = event.priority;
    if (priority !== undefined && !EVENT_PRIORITIES.includes(priority as (typeof EVENT_PRIORITIES)[number])) {
      throw new TypeError(
        `picoprint events[${index}].priority must be one of: ${EVENT_PRIORITIES.join(", ")}`,
      );
    }
  }
};

const isCalendarOptionsInput = (value: unknown): value is CalendarOptions => {
  return isOptionsObject(value) && !(value instanceof Date);
};

const renderCalendarFooter = (config: {
  events?: readonly CalendarEvent[];
  year: number;
  month: number;
  width: number;
  highlightToday: boolean;
  highlightWeekends: boolean;
  today: Date;
}) => {
  const { events, year, month, width, highlightToday, highlightWeekends, today } = config;
  const footerLines: string[] = [];

  footerLines.push(colors.gray(getSeparator(width)));

  if (events && events.length > 0) {
    footerLines.push(colors.cyan(colors.bold("Events:")));
    for (const event of events) {
      if (event.date.getFullYear() !== year || event.date.getMonth() !== month) continue;
      const eventColor = event.color ?? colors.green;
      const priorityIcon = (event.priority && PRIORITY_ICONS[event.priority]) || "📌";
      footerLines.push(
        `  ${eventColor("●")} ${formatDate(event.date, "DD")} - ${priorityIcon} ${event.label}`,
      );
    }
  }

  if (highlightToday) {
    footerLines.push(`${colors.yellow("●")} Today: ${formatDate(today)}`);
  }
  if (highlightWeekends) {
    footerLines.push(`${colors.blue("●")} Weekends`);
  }

  return footerLines;
};

export function calendar(options?: CalendarOptions): string;
export function calendar(date?: Date, options?: CalendarOptions): string;
export function calendar(dateOrOptions: CalendarOptions | Date = new Date(), options: CalendarOptions = {}) {
  const isOptionsOnly = isCalendarOptionsInput(dateOrOptions);
  const date = isOptionsOnly ? new Date() : dateOrOptions;
  const opts = isOptionsOnly ? dateOrOptions : options;

  validateCalendarOptions(date, opts);
  const {
    firstDayOfWeek = 1,
    showWeekNumbers = false,
    highlightToday = true,
    highlightWeekends = true,
    showHeader = false,
    showFooter = false,
    events,
  } = opts;
  const ctx = resolveRenderContext(opts);
  const width = ctx.getWidth();

  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const adjustedFirstDay = (firstDay - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;

  // build event lookup when events are provided
  let eventsByDate: Map<string, CalendarEvent[]> | undefined;
  if (events && events.length > 0) {
    eventsByDate = new Map();
    for (const event of events) {
      if (event.date.getFullYear() !== year || event.date.getMonth() !== month) continue;
      const dateKey = event.date.getDate().toString();
      const dateEvents = eventsByDate.get(dateKey) || [];
      dateEvents.push(event);
      eventsByDate.set(dateKey, dateEvents);
    }
  }

  const lines: string[] = [];
  const hasEvents = events && events.length > 0;

  if (showHeader) {
    const headerTitle =
      hasEvents ? `📅 ${monthNames[month]} ${year} - Events` : `📅 ${monthNames[month]} ${year}`;
    lines.push(colors.cyan(colors.bold(headerTitle)));
    lines.push(colors.gray(getSeparator(width)));
  }

  let headerRow = showWeekNumbers ? "   " : "";
  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    const dayIndex = (firstDayOfWeek + i) % DAYS_PER_WEEK;
    const dayName = dayNamesMin[dayIndex] || "";
    headerRow += ` ${colors.cyan(dayName)}`;
  }
  lines.push(headerRow);

  const weeks = Math.ceil((daysInMonth + adjustedFirstDay) / DAYS_PER_WEEK);

  for (let week = 0; week < weeks; week++) {
    let row = "";

    if (showWeekNumbers) {
      const weekDate = new Date(year, month, Math.max(1, 1 - adjustedFirstDay + week * DAYS_PER_WEEK));
      const weekNum = getWeekNumber(weekDate);
      row += colors.dim(`${weekNum.toString().padStart(2)} `);
    }

    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const cellDate = 1 - adjustedFirstDay + week * DAYS_PER_WEEK + day;

      if (cellDate < 1 || cellDate > daysInMonth) {
        row += "   ";
        continue;
      }

      const cellDateObj = new Date(year, month, cellDate);
      const isToday = highlightToday && isSameDay(cellDateObj, today);
      const dateEvents = eventsByDate?.get(cellDate.toString());

      let cellText = cellDate.toString().padStart(2);

      if (dateEvents && dateEvents.length > 0) {
        const event = dateEvents[0];
        const eventColor = event?.color ?? colors.green;
        cellText = eventColor(colors.bold(cellText));
      } else if (isToday) {
        cellText = colors.yellow(colors.bold(cellText));
      } else if (highlightWeekends && isWeekend(cellDateObj)) {
        cellText = colors.blue(cellText);
      } else {
        cellText = colors.white(cellText);
      }

      row += ` ${cellText}`;
    }

    lines.push(row);
  }

  if (showFooter) {
    lines.push(
      ...renderCalendarFooter({ events, year, month, width, highlightToday, highlightWeekends, today }),
    );
  }

  const indent = " ".repeat(ctx.offset);
  return renderAndReturn(() => {
    for (const line of lines) write(indent + line);
  });
}
