import p from "@/.";
import { printExample } from "./_helpers";

// Basic examples
printExample("Basic Box Examples", [
  {
    title: "Default box",
    handler: () => {
      p.box("This is a simple box with default settings.");
    },
  },
  {
    title: "Double border",
    handler: () => {
      p.box("This box has a double border style!", { style: "double", color: p.green });
    },
  },
  {
    title: "Rounded with title",
    handler: () => {
      p.box("Rounded box with a centered title.", { style: "rounded", title: "Important", color: p.cyan });
    },
  },
  {
    title: "Custom width + padding",
    handler: () => {
      p.box("Custom width and extra padding for breathing room.", {
        width: 50,
        padding: 2,
        color: p.magenta,
      });
    },
  },
]);

// Box title
printExample("Title Alignment", [
  {
    title: "Left aligned title",
    handler: () =>
      p.box("Content with a left-aligned title", {
        style: "double",
        title: "Left",
        titleAlign: "left",
        color: p.cyan,
      }),
  },
  {
    title: "Right aligned title",
    handler: () =>
      p.box("Content with a right-aligned title", {
        style: "single",
        title: "Right",
        titleAlign: "right",
        color: p.magenta,
      }),
  },
  {
    title: "Long title truncated",
    handler: () =>
      p.box("Content", {
        title: "This is a very long title that might need to be truncated",
        width: 40,
        color: p.yellow,
      }),
  },
]);

// Multi-line content
printExample("Multi-line Content", [
  {
    title: "Multiline string",
    handler: () =>
      p.box(`First line\nSecond line\nThird line with ${p.red("colored")} text\nFourth line`, {
        style: "thick",
        color: p.gray,
      }),
  },
  {
    title: "Empty box",
    handler: () => p.box("", { style: "double", color: p.dim }),
  },
]);

// Text wrapping
printExample("Text Wrapping", [
  {
    title: "Long content wraps",
    handler: () => {
      const long =
        "This is a very long line of text that should wrap automatically when it exceeds the maximum width of the box. The wrapping preserves the box structure and padding.";
      p.box(long, { width: 48, style: "thick", color: p.yellow });
    },
  },
]);

// Variants
printExample("Variants", [
  {
    title: "Frame (no padding)",
    handler: () => {
      p.box.frame("This is a frame with no padding", { color: p.red });
    },
  },
  {
    title: "Panel with title",
    handler: () => {
      p.box.panel("Panel Title", "Panel content with rounded corners and padding.", { color: p.green });
    },
  },
]);

// Captured output
printExample("Captured Output", [
  {
    title: "Capture console.log inside",
    handler: () =>
      p.box(
        () => {
          console.log("Line 1: This output is captured");
          console.log("Line 2: Multiple lines work!");
          console.log(p.green("Line 3: Even with colors!"));
        },
        { style: "rounded", title: "Captured Output", color: p.blue },
      ),
  },
]);

// Background colors
printExample("Background Colors", [
  {
    title: "Blue background",
    handler: () => p.box("Box with blue background", { background: p.bgBlue, padding: 1, color: p.white }),
  },
  {
    title: "Magenta background",
    handler: () =>
      p.box("Box with magenta background", { background: p.bgMagenta, padding: 1, color: p.white }),
  },
]);
