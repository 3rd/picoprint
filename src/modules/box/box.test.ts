import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stringWidth } from "@/utils/ansi";
import { colors } from "@/utils/colors";
import { _resetWriterStack, pushWriter, write } from "@/utils/writer";
import { createContext } from "../context";
import { box } from "./box";

describe("box", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
  });

  it("should create a basic box with default settings", () => {
    box("Test content");

    expect(logOutput.length).toBeGreaterThan(0);
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

    expect(logOutput.length).toBeGreaterThan(0);
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

    expect(logOutput.length).toBeGreaterThan(0);
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

    expect(logOutput.length).toBeGreaterThan(0);
    expect(logOutput.length).toBeGreaterThan(2);
  });

  it("should capture console output when given a function", async () => {
    box(() => {
      write("Captured line 1");
      write("Captured line 2");
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

  it("should throw stable errors for invalid color options", () => {
    expect(() => box("Content", { borderColor: "cyan" as never })).toThrow(
      "picoprint borderColor must be a function",
    );
    expect(() => box("Content", { background: "cyan" as never })).toThrow(
      "picoprint background must be a function",
    );
    expect(() => box("Content", { background: colors.blue as never })).toThrow(
      "picoprint background must be a background color function, got a foreground color function",
    );
    expect(() => box("Content", { title: "Title", titleColor: "cyan" as never })).toThrow(
      "picoprint titleColor must be a function",
    );
    expect(logOutput).toHaveLength(0);
  });

  it("should throw stable errors for invalid layout options", () => {
    expect(() => box(12 as never)).toThrow("picoprint box content must be a string or function");
    expect(() => box("Content", 12 as never)).toThrow("picoprint box options must be an object");
    expect(() => box("Content", null as never)).toThrow("picoprint box options must be an object");
    expect(() => box("Content", new Date() as never)).toThrow(
      "picoprint box options must be an object",
    );
    expect(() => box("Content", { width: "wide" as never })).toThrow(
      "picoprint width must be a non-negative integer",
    );
    expect(() => box("Content", { width: 2 })).toThrow("picoprint width must be at least 3");
    expect(() => box("Content", { width: 4, paddingX: 1 })).toThrow(
      "picoprint width must be at least 5 for paddingX 1",
    );
    expect(() => box("Content", { padding: -1 })).toThrow(
      "picoprint padding must be a non-negative integer",
    );
    expect(() => box("Content", { paddingX: 1.5 })).toThrow(
      "picoprint paddingX must be a non-negative integer",
    );
    expect(() => box("Content", { title: 12 as never })).toThrow("picoprint title must be a string");
    expect(() => box("Content", { title: "Title", titleAlign: "middle" as never })).toThrow(
      "picoprint titleAlign must be one of:",
    );
    expect(logOutput).toHaveLength(0);
  });

  describe("box.panel", () => {
    it("should create a panel with rounded corners and extra padding", () => {
      box.panel("Test content", { title: "Panel Title" });

      const output = logOutput.join("\n");
      expect(logOutput[0]).toContain("Panel Title");
      expect(output).toContain("Panel Title");
      expect(output).toContain("Test content");
      expect(output).toContain("╭");
      expect(output).toContain("╮");
      expect(output).toContain("╰");
      expect(output).toContain("╯");
    });

    it("should capture console output when given a function", async () => {
      box.panel(
        () => {
          write("Panel line 1");
          write("Panel line 2");
        },
        { title: "Test Panel" },
      );

      const output = logOutput.join("\n");
      expect(logOutput[0]).toContain("Test Panel");
      expect(output).toContain("Test Panel");

      const panelLines = logOutput.filter(
        (line) => line.includes("Panel line 1") || line.includes("Panel line 2"),
      );
      expect(panelLines.length).toBe(2);
    });

    it("should support the legacy title-first form", () => {
      box.panel("Legacy Title", "Legacy content");

      const output = logOutput.join("\n");
      expect(logOutput[0]).toContain("Legacy Title");
      expect(output).toContain("Legacy content");
    });

    it("should support the legacy title-first callback form", () => {
      box.panel("Test Panel", () => {
        write("Panel line 1");
        write("Panel line 2");
      });

      const output = logOutput.join("\n");
      expect(logOutput[0]).toContain("Test Panel");
      expect(output).toContain("Test Panel");

      const panelLines = logOutput.filter(
        (line) => line.includes("Panel line 1") || line.includes("Panel line 2"),
      );
      expect(panelLines.length).toBe(2);
    });

    it("should accept custom options", () => {
      box.panel("Content", { title: "Title", borderColor: colors.green });

      const output = logOutput.join("\n");
      expect(logOutput[0]).toContain("Title");
      expect(output).toContain("Title");
      expect(output).toContain("Content");
    });

    it("should let custom options override panel defaults", () => {
      box.panel("Content", { title: "Title", style: "double", padding: 0 });

      const output = logOutput.join("\n");
      expect(logOutput).toHaveLength(3);
      expect(output).toContain("╔");
      expect(output).toContain("╚");
      expect(output).not.toContain("╭");
    });

    it("should reject malformed panel options", () => {
      expect(() => box.panel("Content", 12 as never)).toThrow("picoprint box.panel options must be an object");
      expect(() => box.panel("Content", new Date() as never)).toThrow(
        "picoprint box.panel options must be an object",
      );
      expect(() => box.panel("Title", "Content", 12 as never)).toThrow(
        "picoprint box.panel options must be an object",
      );
      expect(() => box.panel("Title", "Content", /bad/ as never)).toThrow(
        "picoprint box.panel options must be an object",
      );
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should return the rendered string for callback content", () => {
      const result = box(() => {
        write("Inside box");
        return 42;
      });

      expect(result).toContain("Inside box");
      expect(result).toContain("┌");
      expect(result).toBe(logOutput.join("\n"));
      expect(logOutput.join("\n")).toContain("Inside box");
    });

    it("should return the rendered string for panel callback content", () => {
      const result = box.panel(
        () => {
          write("Panel content");
          return { value: "test" };
        },
        { title: "Test Panel" },
      );

      expect(result).toContain("Test Panel");
      expect(result).toContain("Panel content");
      expect(result).toBe(logOutput.join("\n"));
      expect(logOutput.join("\n")).toContain("Panel content");
    });

    it("should return string for string content", () => {
      const result = box("String content");

      expect(typeof result).toBe("string");
      expect(result).toContain("String content");
      expect(logOutput.join("\n")).toContain("String content");
    });

    it("should handle content with ANSI codes", () => {
      const coloredContent = "\u001b[31mRed text\u001b[0m";
      box(coloredContent);

      expect(logOutput.join("\n")).toContain("Red text");
    });

    it("should handle very narrow boxes", () => {
      box("Test", { width: 10 });

      expect(logOutput.length).toBeGreaterThan(0);
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
        write(String(undefined));
        write(String(null));
        write(String(123));
      });

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("undefined");
      expect(output).toContain("null");
      expect(output).toContain("123");
    });
  });

  describe("nested rendering", () => {
    it("renders box without indentation when no context provided", () => {
      box("Test content");

      expect(logOutput.length).toBeGreaterThan(0);
      const firstLine = logOutput[0] ?? "";
      // eslint-disable-next-line no-control-regex
      const cleanFirstLine = firstLine.replace(/\u001b\[[\d;]*m/g, "");
      expect(cleanFirstLine).toMatch(/^┌/);
    });

    it("renders box with indentation when context has offset", () => {
      const ctx = createContext(4);
      box("Test content", { renderContext: ctx });

      expect(logOutput.length).toBeGreaterThan(0);

      // All lines should start with 4 spaces
      for (const line of logOutput) {
        expect(line).toMatch(/^ {4}/);
      }
    });

    it("renders box with simple offset option", () => {
      box("Test content", { offset: 4 });

      expect(logOutput.length).toBeGreaterThan(0);
      for (const line of logOutput) expect(line).toMatch(/^ {4}/);
    });

    it("supports nested contexts with cumulative offsets", () => {
      const ctx1 = createContext(2);
      const ctx2 = ctx1.indent(2);
      const ctx3 = ctx2.indent(2);

      box("Level 1", { renderContext: ctx1 });
      box("Level 2", { renderContext: ctx2 });
      box("Level 3", { renderContext: ctx3 });

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
      box("Test", { renderContext: ctx });

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

      box("Deep nested", { renderContext: ctx });

      expect(logOutput.length).toBeGreaterThan(0);

      const firstLine = logOutput[0];
      expect(firstLine).toMatch(/^ {40}/);
    });

    it("supports callback-based nested rendering", async () => {
      await box(async () => {
        write("Level 1");
        box(() => {
          write("Level 2");
        });
      });

      expect(logOutput.length).toBeGreaterThan(0);
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

      write(`${indent}Regular text`);
      box("Box content", { renderContext: ctx });
      write(`${indent}More regular text`);

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
        write("Async content");
        return "async result";
      });

      expect(result).toContain("Async content");
      expect(result).toBe(logOutput.join("\n"));
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
        write(`Got: ${data}`);
        return data;
      });

      expect(result).toContain("Got: fetched data");
      expect(result).toBe(logOutput.join("\n"));
      expect(logOutput.join("\n")).toContain("Got: fetched data");
    });

    it("should handle async callbacks in box.panel", async () => {
      const result = await box.panel(
        async () => {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 10);
          });
          write("Panel async");
          return { success: true };
        },
        { title: "Async Panel" },
      );

      expect(result).toContain("Panel async");
      expect(result).toContain("Async Panel");
      expect(result).toBe(logOutput.join("\n"));
      expect(logOutput.join("\n")).toContain("Panel async");
      expect(logOutput.join("\n")).toContain("Async Panel");
    });

    it("should treat thenable callback results as async", async () => {
      const result = await box(() => {
        write("before-thenable");
        return {
          then: (resolve: (value: unknown) => void) => {
            write("inside-thenable");
            resolve(undefined);
          },
        };
      });

      expect(result).toContain("before-thenable");
      expect(result).toContain("inside-thenable");
      expect(result).toBe(logOutput.join("\n"));
    });

    it("should handle mixed sync and async nested boxes", async () => {
      const result = await box(async () => {
        write("Outer async");
        const innerResult = box(() => {
          write("Inner sync");
          return 99;
        });
        expect(innerResult).toContain("Inner sync");
        return innerResult.length;
      });

      expect(result).toContain("Outer async");
      expect(result).toContain("Inner sync");
      expect(result).toBe(logOutput.join("\n"));
      expect(logOutput.join("\n")).toContain("Outer async");
      expect(logOutput.join("\n")).toContain("Inner sync");
    });

    it("should isolate concurrent async boxes", async () => {
      const delay = (ms: number) =>
        new Promise<void>((r) => {
          setTimeout(r, ms);
        });
      const [resultA, resultB] = await Promise.all([
        box(async () => {
          write("A1");
          await delay(30);
          write("A2");
          return "A";
        }),
        box(async () => {
          write("B1");
          await delay(10);
          write("B2");
          return "B";
        }),
      ]);

      expect(resultA).toContain("A1");
      expect(resultA).toContain("A2");
      expect(resultB).toContain("B1");
      expect(resultB).toContain("B2");
      const output = logOutput.join("\n");
      expect(output).toContain("A1");
      expect(output).toContain("A2");
      expect(output).toContain("B1");
      expect(output).toContain("B2");
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

      expect(logOutput.length).toBeGreaterThan(0);
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
          write("Function output line 1");
          write("Function output line 2");
        },
        { background: colors.bgCyan, padding: 1 },
      );

      const capturedLines = logOutput.filter(
        (line) => line.includes("Function output line 1") || line.includes("Function output line 2"),
      );
      expect(capturedLines.length).toBe(2);
    });
  });

  describe("wide characters", () => {
    it("should align borders for cjk content", () => {
      box("日本語テスト", { width: 20 });
      box("ascii line", { width: 20 });

      const widths = new Set(logOutput.map(stringWidth));
      expect(widths.size).toBe(1);
    });

    it("should align borders for emoji content", () => {
      box("hi 🔥🔥", { width: 16 });

      const widths = new Set(logOutput.map(stringWidth));
      expect(widths.size).toBe(1);
    });
  });

  describe("title truncation", () => {
    it("should keep title color when the title is truncated", () => {
      const mark = (text: string) => `<R>${text}</R>`;
      box("x", { width: 8, title: "verylongtitle", titleColor: mark });

      const topBorder = logOutput[0] ?? "";
      expect(topBorder).toContain("...");
      expect(topBorder).toContain("<R>");
    });
  });
});
