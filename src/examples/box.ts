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
      p.box("This box has a double border style!", { style: "double", borderColor: p.color.green });
    },
  },
  {
    title: "Rounded with title",
    handler: () => {
      p.box("Rounded box with a centered title.", {
        style: "rounded",
        title: "Important",
        borderColor: p.color.cyan,
      });
    },
  },
  {
    title: "Custom width + padding",
    handler: () => {
      p.box("Custom width and extra padding for breathing room.", {
        width: 50,
        padding: 2,
        borderColor: p.color.magenta,
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
        borderColor: p.color.cyan,
      }),
  },
  {
    title: "Right aligned title",
    handler: () =>
      p.box("Content with a right-aligned title", {
        style: "single",
        title: "Right",
        titleAlign: "right",
        borderColor: p.color.magenta,
      }),
  },
  {
    title: "Long title truncated",
    handler: () =>
      p.box("Content", {
        title: "This is a very long title that might need to be truncated",
        width: 40,
        borderColor: p.color.yellow,
      }),
  },
]);

// Multi-line content
printExample("Multi-line Content", [
  {
    title: "Multiline string",
    handler: () =>
      p.box(`First line\nSecond line\nThird line with ${p.color.red("colored")} text\nFourth line`, {
        style: "thick",
        borderColor: p.color.gray,
      }),
  },
  {
    title: "Empty box",
    handler: () => p.box("", { style: "double", borderColor: p.color.dim }),
  },
]);

// Text wrapping
printExample("Text Wrapping", [
  {
    title: "Long content wraps",
    handler: () => {
      const long =
        "This is a very long line of text that should wrap automatically when it exceeds the maximum width of the box. The wrapping preserves the box structure and padding.";
      p.box(long, { width: 48, style: "thick", borderColor: p.color.yellow });
    },
  },
]);

// Variants
printExample("Variants", [
  {
    title: "Panel with title",
    handler: () => {
      p.box.panel("Panel Title", "Panel content with rounded corners and padding.", {
        borderColor: p.color.green,
      });
    },
  },
]);

// Captured output
printExample("Captured Output", [
  {
    title: "Capture p.log() inside",
    handler: () =>
      p.box(
        () => {
          p.log("Line 1: This output is captured");
          p.log("Line 2: Multiple lines work!");
          p.log(p.color.green("Line 3: Even with colors!"));
        },
        { style: "rounded", title: "Captured Output", borderColor: p.color.blue },
      ),
  },
]);

// Background colors
printExample("Background Colors", [
  {
    title: "Blue background",
    handler: () =>
      p.box("Box with blue background", {
        background: p.color.bgBlue,
        padding: 1,
        borderColor: p.color.white,
      }),
  },
  {
    title: "Magenta background",
    handler: () =>
      p.box("Box with magenta background", {
        background: p.color.bgMagenta,
        padding: 1,
        borderColor: p.color.white,
      }),
  },
]);
