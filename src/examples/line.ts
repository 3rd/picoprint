import p from "@/.";
import { printExample } from "./_helpers";

// Line styles
printExample("Line Styles", [
  { title: "Single (default)", handler: () => p.line() },
  { title: "Double", handler: () => p.line({ style: "double" }) },
  { title: "Thick", handler: () => p.line({ style: "thick" }) },
  { title: "Dashed", handler: () => p.line({ style: "dashed" }) },
  { title: "Dotted", handler: () => p.line({ style: "dotted" }) },
  { title: "Rounded", handler: () => p.line({ style: "rounded" }) },
  { title: "ascii", handler: () => p.line({ style: "ascii" }) },
  { title: "Bold", handler: () => p.line({ style: "bold" }) },
  { title: "Light", handler: () => p.line({ style: "light" }) },
]);

// Line width
printExample("Line Width", [{ title: "Custom width", handler: () => p.line({ width: 40 }) }]);

// Line labels
printExample("Line Labels", [
  { title: "Default label", handler: () => p.line("Section Title") },
  { title: "Left-aligned label", handler: () => p.line({ label: "Left Aligned", align: "left" }) },
  { title: "Right-aligned label", handler: () => p.line({ label: "Right Aligned", align: "right" }) },
  { title: "Custom padding", handler: () => p.line({ label: "Extra Padding", padding: 10 }) },
  { title: "Custom separator", handler: () => p.line({ label: "Custom Separator", separator: "|" }) },
  {
    title: "Custom separator pair",
    handler: () => p.line({ label: "Custom Separator Pair", separator: { left: "<<<", right: ">>>" } }),
  },
]);

// Line label colors
printExample("Line Label Colors", [
  { title: "Default color", handler: () => p.line({ label: "Default Foreground Color" }) },
  { title: "Red label", handler: () => p.line({ label: "Red Label", titleColor: p.red }) },
  { title: "Green label", handler: () => p.line({ label: "Green Label", titleColor: p.green }) },
  {
    title: "Blue label + yellow line",
    handler: () => p.line({ label: "Blue Label", titleColor: p.blue, color: p.yellow }),
  },
  { title: "Bright cyan label", handler: () => p.line({ label: "Bright Cyan", titleColor: p.cyanBright }) },
  {
    title: "Bold magenta label",
    handler: () => p.line({ label: "Bold Magenta", titleColor: (text) => p.bold(p.magenta(text)) }),
  },
  { title: "Underlined label", handler: () => p.line({ label: "Underlined", titleColor: p.underline }) },
]);

// Shortcuts
printExample("Shortcuts", [
  { title: "line.thin", handler: () => p.line.thin("Thin Line") },
  { title: "line.thick", handler: () => p.line.thick("Thick Line") },
  { title: "line.double", handler: () => p.line.double("Double Line") },
  { title: "line.dashed", handler: () => p.line.dashed("Dashed Line") },
  { title: "line.dotted", handler: () => p.line.dotted("Dotted Line") },
  { title: "line.rounded", handler: () => p.line.rounded("Rounded Line") },
  { title: "line.ascii", handler: () => p.line.ascii("ascii line") },
  { title: "line.bold", handler: () => p.line.bold("Bold Line") },
  { title: "line.light", handler: () => p.line.light("Light Line") },
  { title: "line.section", handler: () => p.line.section("Section Title") },
]);

// Special patterns
printExample("Special Patterns", [
  { title: "Gradient", handler: () => p.line.gradient({ start: p.magenta, end: p.yellow }) },
]);
