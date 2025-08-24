import p from "@/.";
import { printExample } from "./_helpers";

// Basic examples
printExample("Calendar Options", [
  { title: "Basic calendar", handler: () => p.calendar() },
  {
    title: "With header/footer",
    handler: () =>
      p.calendar(new Date(), {
        showHeader: true,
        showFooter: true,
      }),
  },
  {
    title: "Custom options",
    handler: () =>
      p.calendar(new Date(), {
        firstDayOfWeek: 0,
        showWeekNumbers: true,
        showHeader: true,
        showFooter: true,
      }),
  },
]);

// With events
printExample("Calendar with Events", [
  {
    title: "Events",
    handler: () =>
      p.calendarWithEvents(new Date(), [
        {
          date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
          label: "Team Meeting",
          color: p.green,
          priority: "high",
        },
        {
          date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
          label: "Project Deadline",
          color: p.red,
          priority: "high",
        },
        {
          date: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
          label: "Code Review",
          color: p.blue,
          priority: "medium",
        },
      ]),
  },
  {
    title: "Events with header/footer",
    handler: () =>
      p.calendarWithEvents(
        new Date(),
        [
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
            label: "Team Meeting",
            color: p.green,
            priority: "high",
          },
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
            label: "Project Deadline",
            color: p.red,
            priority: "high",
          },
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
            label: "Code Review",
            color: p.blue,
            priority: "medium",
          },
        ],
        {
          showHeader: true,
          showFooter: true,
        },
      ),
  },
]);
