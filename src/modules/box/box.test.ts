import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { colors } from "../colors";
import { createContext } from "../context";
import { box } from "./box";

describe("box", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;
  let logOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    logOutput = [];
    logSpy = mock((...args) => {
      logOutput.push(args.map(String).join(" "));
    });
    console.log = logSpy;
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("should create a basic box with default settings", () => {
    box("Test content");

    expect(logSpy).toHaveBeenCalled();
    expect(logOutput.length).toBeGreaterThan(2);

    const output = logOutput.join("\n");
    expect(output).toContain("Test content");
    expect(output).toContain("┌");
    expect(output).toContain("┐");
    expect(output).toContain("└");
    expect(output).toContain("┘");
    expect(output).toContain("│");
    expect(output).toContain("─");
  });

  it("should handle double border style", () => {
    box("Test", { style: "double" });

    const output = logOutput.join("\n");
    expect(output).toContain("╔");
    expect(output).toContain("╗");
    expect(output).toContain("╚");
    expect(output).toContain("╝");
    expect(output).toContain("║");
    expect(output).toContain("═");
  });

  it("should handle rounded border style", () => {
    box("Test", { style: "rounded" });

    const output = logOutput.join("\n");
    expect(output).toContain("╭");
    expect(output).toContain("╮");
    expect(output).toContain("╰");
    expect(output).toContain("╯");
  });

  it("should handle thick border style", () => {
    box("Test", { style: "thick" });

    const output = logOutput.join("\n");
    expect(output).toContain("┏");
    expect(output).toContain("┓");
    expect(output).toContain("┗");
    expect(output).toContain("┛");
    expect(output).toContain("┃");
    expect(output).toContain("━");
  });

  it("should add title to box", () => {
    box("Content", { title: "My Title" });

    const output = logOutput.join("\n");
    expect(output).toContain("My Title");
    expect(output).toContain("Content");
  });

  it("should handle different title alignments", () => {
    box("Content", { title: "Title", titleAlign: "left" });
    expect(logOutput.join("\n")).toContain("Title");

    logOutput = [];
    box("Content", { title: "Title", titleAlign: "right" });
    expect(logOutput.join("\n")).toContain("Title");

    logOutput = [];
    box("Content", { title: "Title", titleAlign: "center" });
    expect(logOutput.join("\n")).toContain("Title");
  });

  it("should handle custom width", () => {
    box("Test", { width: 20 });

    expect(logSpy).toHaveBeenCalled();
    for (const line of logOutput) {
      // eslint-disable-next-line no-control-regex
      const cleanLine = line.replace(/\u001b\[[\d;]*m/g, "");
      expect(cleanLine.length).toBeLessThanOrEqual(20);
    }
  });

  it("should handle custom padding", () => {
    box("Test", { padding: 3 });

    const output = logOutput.join("\n");
    expect(output).toContain("Test");

    const contentLines = logOutput.filter((line) => line.includes("Test"));
    if (contentLines.length > 0 && contentLines[0]) {
      const beforeContent = contentLines[0].slice(0, Math.max(0, contentLines[0].indexOf("Test")));
      const spaces = (beforeContent.match(/ /g) || []).length;
      expect(spaces).toBeGreaterThanOrEqual(3);
    }
  });

  it("should wrap long content", () => {
    const longText =
      "This is a very long line of text that should definitely wrap when placed in a narrow box";
    box(longText, { width: 30 });

    expect(logSpy).toHaveBeenCalled();
    expect(logOutput.join("\n")).toContain("This is");
  });

  it("should handle multiline content", () => {
    box("Line 1\nLine 2\nLine 3");

    const output = logOutput.join("\n");
    expect(output).toContain("Line 1");
    expect(output).toContain("Line 2");
    expect(output).toContain("Line 3");
  });

  it("should handle empty content", () => {
    box("");

    expect(logSpy).toHaveBeenCalled();
    expect(logOutput.length).toBeGreaterThan(2);
  });

  it("should capture console output when given a function", async () => {
    box(() => {
      console.log("Captured line 1");
      console.log("Captured line 2");
    });

    const capturedLines = logOutput.filter(
      (line) => line.includes("Captured line 1") || line.includes("Captured line 2"),
    );
    expect(capturedLines.length).toBe(2);
  });

  it("should truncate very long titles", () => {
    box("Content", {
      title: "This is an extremely long title that should be truncated",
      width: 30,
    });

    expect(logOutput.join("\n")).toContain("...");
  });

  describe("box.frame", () => {
    it("should create a frame with no padding", () => {
      box.frame("Test content");

      const output = logOutput.join("\n");
      expect(output).toContain("Test content");
      expect(output).toContain("┌");
      expect(output).toContain("┐");
      expect(output).toContain("└");
      expect(output).toContain("┘");
    });

    it("should accept custom options", () => {
      box.frame("Test", { style: "double", color: colors.red });

      const output = logOutput.join("\n");
      expect(output).toContain("╔");
      expect(output).toContain("╗");
    });
  });

  describe("box.panel", () => {
    it("should create a panel with rounded corners and extra padding", () => {
      box.panel("Test content", "Panel Title");

      const output = logOutput.join("\n");
      expect(output).toContain("Panel Title");
      expect(output).toContain("Test content");
      expect(output).toContain("╭");
      expect(output).toContain("╮");
      expect(output).toContain("╰");
      expect(output).toContain("╯");
    });

    it("should capture console output when given a function", async () => {
      box.panel("Test Panel", () => {
        console.log("Panel line 1");
        console.log("Panel line 2");
      });

      const output = logOutput.join("\n");
      expect(output).toContain("Test Panel");

      const panelLines = logOutput.filter(
        (line) => line.includes("Panel line 1") || line.includes("Panel line 2"),
      );
      expect(panelLines.length).toBe(2);
    });

    it("should accept custom options", () => {
      box.panel("Content", "Title", { color: colors.green });

      const output = logOutput.join("\n");
      expect(output).toContain("Title");
      expect(output).toContain("Content");
    });
  });

  describe("edge cases", () => {
    it("should return the callback's return value", async () => {
      const result = box(() => {
        console.log("Inside box");
        return 42;
      });

      expect(result).toBe(42);
      expect(logOutput.join("\n")).toContain("Inside box");
    });

    it("should return the callback's return value for panel", async () => {
      const result = box.panel("Test Panel", () => {
        console.log("Panel content");
        return { value: "test" };
      });

      expect(result).toEqual({ value: "test" });
      expect(logOutput.join("\n")).toContain("Panel content");
    });

    it("should return void for string content", () => {
      const result = box("String content");

      expect(result).toBe(undefined);
      expect(logOutput.join("\n")).toContain("String content");
    });

    it("should handle content with ANSI codes", () => {
      const coloredContent = "\u001b[31mRed text\u001b[0m";
      box(coloredContent);

      expect(logOutput.join("\n")).toContain("Red text");
    });

    it("should handle very narrow boxes", () => {
      box("Test", { width: 10 });

      expect(logSpy).toHaveBeenCalled();
      for (const line of logOutput) {
        // eslint-disable-next-line no-control-regex
        const cleanLine = line.replace(/\u001b\[[\d;]*m/g, "");
        expect(cleanLine.length).toBeLessThanOrEqual(10);
      }
    });

    it("should handle zero padding", () => {
      box("Test", { padding: 0 });

      expect(logOutput.join("\n")).toContain("Test");
    });

    it("should handle undefined values in captured output", async () => {
      box(() => {
        console.log(undefined);
        console.log(null);
        console.log(123);
      });

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("undefined");
      expect(output).toContain("null");
      expect(output).toContain("123");
    });
  });

  describe("nested rendering", () => {
    it("renders box without indentation when no context provided", () => {
      box("Test content");

      expect(logSpy).toHaveBeenCalled();
      const firstLine = logOutput[0] ?? "";
      // eslint-disable-next-line no-control-regex
      const cleanFirstLine = firstLine.replace(/\u001b\[[\d;]*m/g, "");
      expect(cleanFirstLine).toMatch(/^┌/);
    });

    it("renders box with indentation when context has offset", () => {
      const ctx = createContext(4);
      box("Test content", { context: ctx });

      expect(logSpy).toHaveBeenCalled();

      // All lines should start with 4 spaces
      for (const line of logOutput) {
        expect(line).toMatch(/^ {4}/);
      }
    });

    it("supports nested contexts with cumulative offsets", () => {
      const ctx1 = createContext(2);
      const ctx2 = ctx1.indent(2);
      const ctx3 = ctx2.indent(2);

      box("Level 1", { context: ctx1 });
      box("Level 2", { context: ctx2 });
      box("Level 3", { context: ctx3 });

      const lines = logOutput;

      const level1Line = lines.find((l) => l.includes("Level 1"));
      const level2Line = lines.find((l) => l.includes("Level 2"));
      const level3Line = lines.find((l) => l.includes("Level 3"));

      expect(level1Line).toMatch(/^ {2}/); // 2 spaces
      expect(level2Line).toMatch(/^ {4}/); // 4 spaces
      expect(level3Line).toMatch(/^ {6}/); // 6 spaces
    });

    it("maintains correct box width with context offset", () => {
      const mockColumns = 80;
      const originalColumns = process.stdout?.columns;

      if (process.stdout) {
        Object.defineProperty(process.stdout, "columns", {
          value: mockColumns,
          configurable: true,
        });
      }

      const ctx = createContext(10);
      box("Test", { context: ctx });

      for (const line of logOutput) {
        // eslint-disable-next-line no-control-regex
        const stripped = line.replace(/\u001b\[[^m]*m/g, "");
        expect(stripped.length).toBe(mockColumns);
      }

      if (process.stdout && originalColumns !== undefined) {
        Object.defineProperty(process.stdout, "columns", {
          value: originalColumns,
          configurable: true,
        });
      }
    });

    it("handles deep nesting gracefully", () => {
      let ctx = createContext();
      for (let i = 0; i < 20; i++) {
        ctx = ctx.indent(2);
      }

      box("Deep nested", { context: ctx });

      expect(logSpy).toHaveBeenCalled();

      const firstLine = logOutput[0];
      expect(firstLine).toMatch(/^ {40}/);
    });

    it("supports callback-based nested rendering", async () => {
      await box(async () => {
        console.log("Level 1");
        box(() => {
          console.log("Level 2");
        });
      });

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("Level 1");
      expect(output).toContain("Level 2");

      const boxChars = logOutput.filter(
        (line) => line.includes("┌") || line.includes("└") || line.includes("┐") || line.includes("┘"),
      );

      expect(boxChars.length).toBeGreaterThanOrEqual(4);

      const allOutput = logOutput.join("\n");
      expect(allOutput).toMatch(/Level 1[\S\s]*Level 2/);
    });

    it("allows mixing regular console output with boxes at same indentation", () => {
      const ctx = createContext(4);
      const indent = " ".repeat(ctx.offset);

      console.log(`${indent}Regular text`);
      box("Box content", { context: ctx });
      console.log(`${indent}More regular text`);

      for (const line of logOutput) {
        expect(line).toMatch(/^ {4}/); // 4 spaces
      }

      expect(logOutput[0]).toContain("Regular text");
      expect(logOutput[logOutput.length - 1]).toContain("More regular text");
    });
  });

  describe("async callbacks", () => {
    it("should handle async callbacks", async () => {
      const result = await box(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        console.log("Async content");
        return "async result";
      });

      expect(result).toBe("async result");
      expect(logOutput.join("\n")).toContain("Async content");
    });

    it("should handle async callbacks that throw errors", () => {
      const promise = box(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        throw new Error("Async error");
      });
      return expect(promise).rejects.toThrow("Async error");
    });

    it("should handle async callbacks with nested async operations", async () => {
      const result = await box(async () => {
        const data = await Promise.resolve("fetched data");
        console.log(`Got: ${data}`);
        return data;
      });

      expect(result).toBe("fetched data");
      expect(logOutput.join("\n")).toContain("Got: fetched data");
    });

    it("should handle async callbacks in box.frame", async () => {
      const result = await box.frame(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        console.log("Frame async");
        return 123;
      });

      expect(result).toBe(123);
      expect(logOutput.join("\n")).toContain("Frame async");
    });

    it("should handle async callbacks in box.panel", async () => {
      const result = await box.panel("Async Panel", async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        console.log("Panel async");
        return { success: true };
      });

      expect(result).toEqual({ success: true });
      expect(logOutput.join("\n")).toContain("Panel async");
      expect(logOutput.join("\n")).toContain("Async Panel");
    });

    it("should handle mixed sync and async nested boxes", async () => {
      const result = await box(async () => {
        console.log("Outer async");
        const innerResult = box(() => {
          console.log("Inner sync");
          return 99;
        });
        return innerResult * 2;
      });

      expect(result).toBe(198);
      expect(logOutput.join("\n")).toContain("Outer async");
      expect(logOutput.join("\n")).toContain("Inner sync");
    });
  });

  describe("background colors", () => {
    beforeEach(() => {
      process.env.FORCE_COLOR = "1";
    });

    afterEach(() => {
      delete process.env.FORCE_COLOR;
    });

    it("should accept background color option", () => {
      box("test content", { background: colors.bgRed });

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.length).toBeGreaterThan(0);

      const allOutput = logOutput.join("");
      expect(allOutput).toContain("test content");
    });

    it("should handle all supported background colors", () => {
      const bgColors = [
        colors.bgRed,
        colors.bgBlue,
        colors.bgCyan,
        colors.bgGreen,
        colors.bgMagenta,
        colors.bgYellow,
        colors.bgGray,
        colors.bgBlack,
      ];

      for (const bgColor of bgColors) {
        logOutput = [];
        box("test", { background: bgColor });
        expect(logOutput.length).toBeGreaterThan(0);

        const allOutput = logOutput.join("");
        expect(allOutput).toContain("test");
      }
    });

    it("should apply background to content areas with padding", () => {
      box("test content", { background: colors.bgBlue, padding: 2 });

      const allOutput = logOutput.join("\n");
      expect(allOutput).toContain("test content");

      expect(logOutput.length).toBeGreaterThan(3); // top border + padding + content + padding + bottom border
    });

    it("should work with background and title", () => {
      box("content", {
        background: colors.bgGreen,
        title: "Test Title",
        padding: 1,
      });

      const allOutput = logOutput.join("\n");
      expect(allOutput).toContain("Test Title");
      expect(allOutput).toContain("content");
    });

    it("should work with background and different styles", () => {
      const styles = ["single", "double", "rounded", "thick"] as const;

      for (const style of styles) {
        logOutput = [];
        box("test", { background: colors.bgRed, style });

        expect(logOutput.length).toBeGreaterThan(0);
        const allOutput = logOutput.join("");
        expect(allOutput).toContain("test");
      }
    });

    it("should handle multiline content with background", () => {
      const multilineContent = "Line 1\nLine 2\nLine 3";
      box(multilineContent, { background: colors.bgYellow, padding: 1 });

      const allOutput = logOutput.join("\n");
      expect(allOutput).toContain("Line 1");
      expect(allOutput).toContain("Line 2");
      expect(allOutput).toContain("Line 3");
    });

    it("should work with no background (default)", () => {
      box("test content", {});

      const allOutput = logOutput.join("\n");
      expect(allOutput).toContain("test content");
      expect(logOutput.length).toBeGreaterThan(0);
    });

    it("should apply background to captured function output", async () => {
      box(
        () => {
          console.log("Function output line 1");
          console.log("Function output line 2");
        },
        { background: colors.bgCyan, padding: 1 },
      );

      const capturedLines = logOutput.filter(
        (line) => line.includes("Function output line 1") || line.includes("Function output line 2"),
      );
      expect(capturedLines.length).toBe(2);
    });
  });
});
