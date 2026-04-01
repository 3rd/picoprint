import { drawHorizontalLine } from "@/utils/line-styles";
import { renderAndReturn, write } from "@/utils/writer";
import type { CalendarEvent, CalendarOptions } from "./types";
import { colors } from "../colors";
import { getCurrentContext } from "../context";

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const getSeparator = () => drawHorizontalLine(Math.max(1, getCurrentContext().getWidth()));
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

const renderCalendarFooter = (config: {
  events?: CalendarEvent[];
  year: number;
  month: number;
  highlightToday: boolean;
  highlightWeekends: boolean;
  today: Date;
}) => {
  const { events, year, month, highlightToday, highlightWeekends, today } = config;
  const footerLines: string[] = [];

  footerLines.push(colors.gray(getSeparator()));

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

export const calendar = (date: Date = new Date(), options: CalendarOptions = {}) => {
  const {
    firstDayOfWeek = 1,
    showWeekNumbers = false,
    highlightToday = true,
    highlightWeekends = true,
    showHeader = false,
    showFooter = false,
    events,
    renderContext,
  } = options;

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
    lines.push(...renderCalendarFooter({ events, year, month, highlightToday, highlightWeekends, today }));
  }

  const ctx = renderContext ?? getCurrentContext();
  const indent = " ".repeat(ctx.offset);
  return renderAndReturn(() => {
    for (const line of lines) write(indent + line);
  });
};
