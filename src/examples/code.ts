import p from "@/.";
import { printExample } from "./_helpers";

const tsCode = `type Num = number;
export function sum(a: Num, b: Num): Num { return a + b; }
export function mul(a: Num, b: Num): Num { return a * b; }
console.log(sum(2, 3), mul(2, 3));`;

const sqlCode = `SELECT id, name
FROM users
WHERE active = TRUE
ORDER BY name ASC;`;

// Language highlighting
printExample("Language Highlighting", [
  { title: "typescript", handler: () => p.code(tsCode, "typescript") },
  { title: "sql", handler: () => p.code(sqlCode, "sql") },
]);

// Window styles
printExample("Window Styles", [
  {
    title: "single (default)",
    handler: () => p.code(tsCode, { language: "typescript", window: true, title: "single" }),
  },
  {
    title: "double",
    handler: () => p.code(tsCode, { language: "typescript", window: "double", title: "double" }),
  },
  {
    title: "rounded",
    handler: () => p.code(tsCode, { language: "typescript", window: "rounded", title: "rounded" }),
  },
  {
    title: "thick",
    handler: () => p.code(tsCode, { language: "typescript", window: "thick", title: "thick" }),
  },
]);

// Title alignment
printExample("Title Alignment", [
  {
    title: "left",
    handler: () =>
      p.code(tsCode, { language: "typescript", window: true, title: "left aligned", titleAlign: "left" }),
  },
  {
    title: "center",
    handler: () =>
      p.code(tsCode, { language: "typescript", window: true, title: "center aligned", titleAlign: "center" }),
  },
  {
    title: "right",
    handler: () =>
      p.code(tsCode, { language: "typescript", window: true, title: "right aligned", titleAlign: "right" }),
  },
]);

// Line numbers
printExample("Line Numbers", [
  { title: "plain", handler: () => p.code(tsCode, { language: "typescript", lineNumbers: true }) },
  {
    title: "in window",
    handler: () =>
      p.code(tsCode, { language: "typescript", window: true, title: "line numbers", lineNumbers: true }),
  },
  {
    title: "rounded window",
    handler: () =>
      p.code(tsCode, {
        language: "typescript",
        window: "rounded",
        title: "rounded + numbers",
        lineNumbers: true,
      }),
  },
]);

// Padding & width
printExample("Padding & Width", [
  {
    title: "padding",
    handler: () => p.code(tsCode, { language: "typescript", window: true, title: "padding: 2", padding: 2 }),
  },
  {
    title: "paddingX only",
    handler: () =>
      p.code(tsCode, {
        language: "typescript",
        window: true,
        title: "paddingX: 4",
        paddingX: 4,
        paddingY: 0,
      }),
  },
  {
    title: "paddingY only",
    handler: () =>
      p.code(tsCode, {
        language: "typescript",
        window: true,
        title: "paddingY: 2",
        paddingX: 0,
        paddingY: 2,
      }),
  },
  {
    title: "custom width",
    handler: () => p.code(tsCode, { language: "typescript", window: true, title: "width: 40", width: 40 }),
  },
]);

// Colors
printExample("Colors", [
  {
    title: "background",
    handler: () =>
      p.code(tsCode, { language: "typescript", window: true, title: "bg red", background: p.bgRed }),
  },
  {
    title: "border color",
    handler: () =>
      p.code(tsCode, {
        language: "typescript",
        window: "rounded",
        title: "border green",
        borderColor: p.green,
      }),
  },
  {
    title: "title color",
    handler: () =>
      p.code(tsCode, {
        language: "typescript",
        window: "double",
        title: "title yellow",
        titleColor: p.yellow,
        borderColor: p.gray,
      }),
  },
]);

// Edge cases
printExample("Edge Cases", [
  { title: "empty block", handler: () => p.code("", { window: true, title: "empty" }) },
  {
    title: "very long line",
    handler: () =>
      p.code(
        `const longString = "This is a very long string that might exceed the typical terminal width and demonstrate how the code module handles line wrapping or overflow situations in different terminal environments";`,
        { language: "typescript", window: true, title: "long line", lineNumbers: true },
      ),
  },
  {
    title: "special characters",
    handler: () =>
      p.code(
        `const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
const emoji = "🚀 Launch! 🎉";
const unicode = "Hello → 世界 → мир";`,
        { language: "typescript", window: "rounded", title: "special" },
      ),
  },
]);
