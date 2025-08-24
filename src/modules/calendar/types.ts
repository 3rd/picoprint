import type { ForegroundColorFunction } from "../../utils/colors";

export interface CalendarOptions {
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekNumbers?: boolean;
  highlightToday?: boolean;
  highlightWeekends?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface CalendarEvent {
  date: Date;
  label: string;
  color?: ForegroundColorFunction;
  priority?: "high" | "low" | "medium";
}
