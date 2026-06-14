import type { ForegroundColorOption } from "../../utils/colors";
import type { RenderOptions } from "../context";

export interface CalendarOptions {
  offset?: RenderOptions["offset"];
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekNumbers?: boolean;
  highlightToday?: boolean;
  highlightWeekends?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  events?: readonly CalendarEvent[];
  renderContext?: RenderOptions["renderContext"];
}

export interface CalendarEvent {
  date: Date;
  label: string;
  color?: ForegroundColorOption;
  priority?: "high" | "low" | "medium";
}
