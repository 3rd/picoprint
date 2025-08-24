import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import type { CalendarEvent } from "./types";
import { colors } from "../colors";
import { calendar, calendarWithEvents } from "./calendar";

// eslint-disable-next-line no-control-regex
const stripAnsi = (str: string) => str.replace(/\u001b\[[\d;]*m/g, "");

const JANUARY = 0;
const FEBRUARY = 1;
const JULY = 6;
const AUGUST = 7;
const DECEMBER = 11;

describe("calendar", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;

  beforeEach(() => {
    originalLog = console.log;
    logSpy = mock((..._args) => {});
    console.log = logSpy;
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("should render a basic calendar", () => {
    const result = calendar(new Date(2025, AUGUST, 15));
    const stripped = stripAnsi(result);
    expect(stripped).not.toContain("August 2025");
    expect(stripped).toContain("Mo Tu We Th Fr Sa Su");
    expect(stripped).toContain("15");
  });

  it("should render calendar with header when enabled", () => {
    const result = calendar(new Date(2025, AUGUST, 15), { showHeader: true });
    const stripped = stripAnsi(result);
    expect(stripped).toContain("August 2025");
    expect(stripped).toContain("Mo Tu We Th Fr Sa Su");
    const lines = stripped.split("\n");
    expect(lines[0]).toContain("August");
  });

  it("should render calendar with footer when enabled", () => {
    const result = calendar(new Date(2025, AUGUST, 15), { showFooter: true });
    expect(result).toContain("Today:");
    expect(result).toContain("Weekends");
  });

  it("should render calendar without header and footer", () => {
    const result = calendar(new Date(2025, AUGUST, 15), {
      showHeader: false,
      showFooter: false,
    });
    const stripped = stripAnsi(result);
    expect(stripped).not.toContain("August 2025");
    expect(stripped).not.toContain("Today:");
    expect(stripped).toContain("Mo Tu We Th Fr Sa Su");
    const lines = stripped.split("\n");
    expect(lines.length).toBeLessThan(10);
  });

  it("should support different first day of week", () => {
    const result = calendar(new Date(2025, AUGUST, 15), { firstDayOfWeek: 0 });
    const stripped = stripAnsi(result);
    expect(stripped).toContain("Su Mo Tu We Th Fr Sa");
  });

  it("should show week numbers when enabled", () => {
    const result = calendar(new Date(2025, AUGUST, 15), { showWeekNumbers: true });
    const stripped = stripAnsi(result);
    expect(stripped).toMatch(/\d{1,2}\s+\d/);
  });

  it("should highlight today", () => {
    const today = new Date();
    const result = calendar(today, { highlightToday: true, showFooter: true });
    expect(result).toContain("Today:");
  });

  it("should not highlight today when disabled", () => {
    const today = new Date();
    const result = calendar(today, { highlightToday: false, showFooter: true });
    expect(result).not.toContain("Today:");
  });

  it("should handle January correctly", () => {
    const result = calendar(new Date(2025, JANUARY, 1));
    expect(result).toContain(" 1");
  });

  it("should handle December correctly", () => {
    const result = calendar(new Date(2025, DECEMBER, 31));
    expect(result).toContain("31");
  });

  it("should handle leap year February", () => {
    const result = calendar(new Date(2024, FEBRUARY, 1));
    expect(result).toContain("29");
  });

  it("should handle non-leap year February", () => {
    const result = calendar(new Date(2025, FEBRUARY, 1));
    expect(result).not.toContain("29");
  });

  describe("with events", () => {
    const createEvent = (day: number, label: string): CalendarEvent => ({
      date: new Date(2025, AUGUST, day),
      label,
      color: colors.green,
      priority: "medium",
    });

    it("should render calendar with events", () => {
      const events = [createEvent(10, "Meeting"), createEvent(20, "Deadline")];
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, {
        showHeader: true,
        showFooter: true,
      });
      expect(result).toContain("August 2025 - Events");
      expect(result).toContain("Events:");
      expect(result).toContain("Meeting");
      expect(result).toContain("Deadline");
    });

    it("should render without header when showHeader is false", () => {
      const events = [createEvent(10, "Meeting")];
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, {
        showHeader: false,
      });
      const stripped = stripAnsi(result);
      expect(stripped).not.toContain("August 2025 - Events");
      expect(stripped).toContain("Mo Tu We Th Fr Sa Su");
    });

    it("should render with footer when showFooter is true", () => {
      const events = [createEvent(10, "Meeting")];
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, {
        showHeader: true,
        showFooter: true,
      });
      const stripped = stripAnsi(result);
      expect(stripped).toContain("August 2025 - Events");
      expect(stripped).toContain("Events:");
      expect(stripped).toContain("Meeting");
    });

    it("should handle empty events array", () => {
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), [], { showHeader: true });
      expect(result).toContain("August 2025 - Events");
      expect(result).not.toContain("Events:");
    });

    it("should filter events by month", () => {
      const events = [
        createEvent(10, "August Event"),
        {
          date: new Date(2025, JULY, 15),
          label: "July Event",
          color: colors.blue,
          priority: "high" as const,
        },
      ];
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, { showFooter: true });
      expect(result).toContain("August Event");
      expect(result).not.toContain("July Event");
    });

    it("should handle different event priorities", () => {
      const events: CalendarEvent[] = [
        { date: new Date(2025, AUGUST, 10), label: "High", priority: "high" },
        { date: new Date(2025, AUGUST, 11), label: "Medium", priority: "medium" },
        { date: new Date(2025, AUGUST, 12), label: "Low", priority: "low" },
      ];
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, { showFooter: true });
      expect(result).toContain("🔥");
      expect(result).toContain("⚡");
      expect(result).toContain("📌");
    });

    it("should handle different event colors", () => {
      const colorNames = ["red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const;
      const events = colorNames.map((colorName, i) => ({
        date: new Date(2025, AUGUST, i + 1),
        label: `Event ${i}`,
        color: colors[colorName],
      }));
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, { showFooter: true });
      expect(result).toContain("Events:");
      for (const event of events) {
        expect(result).toContain(event.label);
      }
    });

    it("should handle multiple events on same day", () => {
      const events = [
        createEvent(15, "Meeting 1"),
        createEvent(15, "Meeting 2"),
        createEvent(15, "Meeting 3"),
      ];
      const result = calendarWithEvents(new Date(2025, AUGUST, 1), events, { showFooter: true });
      expect(result).toContain("Meeting 1");
      expect(result).toContain("Meeting 2");
      expect(result).toContain("Meeting 3");
    });
  });
});
