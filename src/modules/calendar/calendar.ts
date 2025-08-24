import type { CalendarEvent, CalendarOptions } from "./types";
import { colors } from "../../utils/colors";
import { getCurrentContext } from "../context";

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const getSeparator = () => {
  const ctx = getCurrentContext();
  const width = Math.max(1, ctx.getWidth());
  return "─".repeat(width);
};
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

export const calendar = (date: Date = new Date(), options: CalendarOptions = {}) => {
  const {
    firstDayOfWeek = 1,
    showWeekNumbers = false,
    highlightToday = true,
    highlightWeekends = true,
    showHeader = false,
    showFooter = false,
  } = options;

  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const adjustedFirstDay = (firstDay - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;

  const lines: string[] = [];

  if (showHeader) {
    lines.push(colors.cyan(colors.bold(`📅 ${monthNames[month]} ${year}`)));
    lines.push(colors.gray(getSeparator()));
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
      const isWeekendDay = highlightWeekends && isWeekend(cellDateObj);

      let cellText = cellDate.toString().padStart(2);

      if (isToday) {
        cellText = colors.yellow(colors.bold(cellText));
      } else if (isWeekendDay) {
        cellText = colors.blue(cellText);
      } else {
        cellText = colors.white(cellText);
      }

      row += ` ${cellText}`;
    }

    lines.push(row);
  }

  if (showFooter) {
    lines.push(colors.gray(getSeparator()));

    if (highlightToday) {
      lines.push(`${colors.yellow("●")} Today: ${formatDate(today)}`);
    }
    if (highlightWeekends) {
      lines.push(`${colors.blue("●")} Weekends`);
    }
  }

  const output = lines.join("\n");
  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);
  for (const line of lines) console.log(indent + line);
  return output;
};

export const calendarWithEvents = (date: Date, events: CalendarEvent[], options: CalendarOptions = {}) => {
  const {
    firstDayOfWeek = 1,
    showWeekNumbers = false,
    highlightToday = true,
    highlightWeekends = true,
    showHeader = false,
    showFooter = false,
  } = options;

  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const adjustedFirstDay = (firstDay - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    if (event.date.getFullYear() !== year || event.date.getMonth() !== month) {
      continue;
    }
    const dateKey = event.date.getDate().toString();
    const dateEvents = eventsByDate.get(dateKey) || [];
    dateEvents.push(event);
    eventsByDate.set(dateKey, dateEvents);
  }

  const lines: string[] = [];

  if (showHeader) {
    lines.push(colors.cyan(colors.bold(`📅 ${monthNames[month]} ${year} - Events`)));
    lines.push(colors.gray(getSeparator()));
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
      const dateEvents = eventsByDate.get(cellDate.toString()) || [];

      let cellText = cellDate.toString().padStart(2);

      if (dateEvents.length > 0) {
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

  if (!showFooter) {
    const output = lines.join("\n");
    const ctx = getCurrentContext();
    const indent = " ".repeat(ctx.offset);
    for (const line of lines) console.log(indent + line);
    return output;
  }

  lines.push(colors.gray(getSeparator()));

  if (events.length > 0) {
    lines.push(colors.cyan(colors.bold("Events:")));
    for (const event of events) {
      if (event.date.getFullYear() !== year || event.date.getMonth() !== month) {
        continue;
      }
      const eventColor = event.color ?? colors.green;
      const priorityIcon = (() => {
        if (event.priority === "high") return "🔥";
        if (event.priority === "medium") return "⚡";
        return "📌";
      })();
      lines.push(`  ${eventColor("●")} ${formatDate(event.date, "DD")} - ${priorityIcon} ${event.label}`);
    }
  }

  const output = lines.join("\n");
  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);
  for (const line of lines) console.log(indent + line);
  return output;
};
