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
      p.calendar(new Date(), {
        events: [
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
            label: "Team Meeting",
            color: p.color.green,
            priority: "high",
          },
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
            label: "Project Deadline",
            color: p.color.red,
            priority: "high",
          },
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
            label: "Code Review",
            color: p.color.blue,
            priority: "medium",
          },
        ],
      }),
  },
  {
    title: "Events with header/footer",
    handler: () =>
      p.calendar(new Date(), {
        showHeader: true,
        showFooter: true,
        events: [
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
            label: "Team Meeting",
            color: p.color.green,
            priority: "high",
          },
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
            label: "Project Deadline",
            color: p.color.red,
            priority: "high",
          },
          {
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
            label: "Code Review",
            color: p.color.blue,
            priority: "medium",
          },
        ],
      }),
  },
]);
