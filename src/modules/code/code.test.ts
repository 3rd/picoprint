import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { colors } from "@/utils/colors";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { _resetBatCache, _setBatAvailable } from "./code";
import { code } from "./code";

describe("code", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
    _resetBatCache();
  });

  describe("fallback behavior", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should display code with markdown-style fences", () => {
      code("const x = 42;", "javascript");

      expect(logOutput).toHaveLength(3);
      expect(logOutput[0]).toContain("```javascript");
      expect(logOutput[1]).toBe("const x = 42;");
      expect(logOutput[2]).toContain("```");
    });

    it("should handle empty code", () => {
      code("");

      expect(logOutput).toHaveLength(3);
      expect(logOutput[0]).toContain("```");
      expect(logOutput[1]).toBe("");
      expect(logOutput[2]).toContain("```");
    });

    it("should handle code without language specification", () => {
      code("function test() { return 42; }");

      expect(logOutput).toHaveLength(3);
      expect(logOutput[0]).toContain("```");
      expect(logOutput[1]).toBe("function test() { return 42; }");
      expect(logOutput[2]).toContain("```");
    });

    it("should handle multi-line code", () => {
      const codeString = `function hello() {
  console.log("Hello");
}`;

      code(codeString, "javascript");

      expect(logOutput).toHaveLength(3);
      expect(logOutput[0]).toContain("```javascript");
      expect(logOutput[1]).toBe(codeString);
      expect(logOutput[2]).toContain("```");
    });

    it("should indent fallback code with offset", () => {
      code("const x = 1;", { language: "javascript", offset: 2 });

      expect(logOutput).toHaveLength(3);
      for (const line of logOutput) expect(line).toMatch(/^ {2}/);
      expect(logOutput[1]).toBe("  const x = 1;");
    });
  });

  describe("language argument support", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should accept language as a string argument", () => {
      code("const x = 1;", "javascript");
      expect(logOutput).toHaveLength(3);
      expect(logOutput[0]).toContain("```javascript");
    });

    it("should accept language via options", () => {
      code("const x: number = 1;", { language: "typescript" });
      expect(logOutput).toHaveLength(3);
      expect(logOutput[0]).toContain("```typescript");
    });
  });

  describe("frame rendering", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should render code in a single-line frame", () => {
      code("const x = 42;", { frame: true });

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("┌");
      expect(output).toContain("┐");
      expect(output).toContain("└");
      expect(output).toContain("┘");
      expect(output).toContain("│");
      expect(output).toContain("const x = 42;");
    });

    it("should render code in a frame with frame: true", () => {
      code("const x = 42;", { frame: true });

      const output = logOutput.join("\n");
      expect(output).toContain("┌");
      expect(output).toContain("┘");
      expect(output).toContain("const x = 42;");
    });

    it("should prefer frame over compatibility aliases", () => {
      code("test", { frame: "rounded", window: "double", style: "thick" });

      const output = logOutput.join("\n");
      expect(output).toContain("╭");
      expect(output).toContain("╯");
      expect(output).not.toContain("╔");
      expect(output).not.toContain("┏");
    });

    it("should support the window compatibility alias", () => {
      code("test", { window: "double" });

      const output = logOutput.join("\n");
      expect(output).toContain("╔");
      expect(output).toContain("╝");
    });

    it("should support the style compatibility alias", () => {
      code("test", { style: "double" });

      const output = logOutput.join("\n");
      expect(output).toContain("╔");
      expect(output).toContain("╗");
      expect(output).toContain("╚");
      expect(output).toContain("╝");
      expect(output).toContain("║");
    });

    it("should render code with rounded border style", () => {
      code("test", { frame: "rounded" });

      const output = logOutput.join("\n");
      expect(output).toContain("╭");
      expect(output).toContain("╮");
      expect(output).toContain("╰");
      expect(output).toContain("╯");
    });

    it("should render code with thick border style", () => {
      code("test", { frame: "thick" });

      const output = logOutput.join("\n");
      expect(output).toContain("┏");
      expect(output).toContain("┓");
      expect(output).toContain("┗");
      expect(output).toContain("┛");
      expect(output).toContain("┃");
    });

    it("should handle empty code in a frame", () => {
      code("", { frame: true, title: "Empty" });

      const output = logOutput.join("\n");
      expect(output).toContain("Empty");
      expect(output).toContain("┌");
      expect(output).toContain("┘");
    });

    it("should handle multi-line code in a frame", () => {
      const multilineCode = `line1
line2
line3`;
      code(multilineCode, { frame: true });

      const output = logOutput.join("\n");
      expect(output).toContain("line1");
      expect(output).toContain("line2");
      expect(output).toContain("line3");
      expect(output).toContain("│");
    });
  });

  describe("title rendering", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should render title in center by default", () => {
      code("test", { frame: true, title: "Test Title" });

      const output = logOutput.join("\n");
      expect(output).toContain("Test Title");
    });

    it("should render title aligned left", () => {
      code("test", { frame: true, title: "Left", titleAlign: "left" });

      expect(logOutput[0]).toContain("Left");
      const titleLine = logOutput[0];
      if (titleLine) {
        const leftPart = titleLine.split("Left")[0];
        if (leftPart) {
          expect(leftPart.includes("┌")).toBe(true);
        }
      }
    });

    it("should render title aligned right", () => {
      code("test", { frame: true, title: "Right", titleAlign: "right" });

      expect(logOutput[0]).toContain("Right");
    });

    it("should truncate very long titles", () => {
      const longTitle = "A".repeat(200);
      code("test", { frame: true, title: longTitle, width: 50 });

      const output = logOutput.join("\n");
      expect(output).toContain("...");
    });
  });

  describe("color option validation", () => {
    it("should throw stable errors for invalid color options", () => {
      expect(() => code("const x = 1;", { frame: true, borderColor: "cyan" as never })).toThrow(
        "picoprint borderColor must be a function",
      );
      expect(() => code("const x = 1;", { background: "cyan" as never })).toThrow(
        "picoprint background must be a function",
      );
      expect(() => code("const x = 1;", { background: colors.blue as never })).toThrow(
        "picoprint background must be a background color function, got a foreground color function",
      );
      expect(() =>
        code("const x = 1;", { frame: true, title: "Title", titleColor: "cyan" as never }),
      ).toThrow("picoprint titleColor must be a function");
      expect(logOutput).toHaveLength(0);
    });

    it("should throw stable errors for invalid layout options", () => {
      expect(() => code(undefined as never)).toThrow("picoprint code source must be a string");
      expect(() => code(12 as never)).toThrow("picoprint code source must be a string");
      expect(() => code("const x = 1;", 12 as never)).toThrow(
        "picoprint code options must be an object",
      );
      expect(() => code("const x = 1;", new Date() as never)).toThrow(
        "picoprint code options must be an object",
      );
      expect(() => code("const x = 1;", { language: 12 as never })).toThrow(
        "picoprint language must be a string",
      );
      expect(() => code("const x = 1;", { frame: 12 as never })).toThrow(
        "picoprint frame must be a boolean or style name",
      );
      expect(() => code("const x = 1;", { frame: true, title: 12 as never })).toThrow(
        "picoprint title must be a string",
      );
      expect(() =>
        code("const x = 1;", { frame: true, title: "Title", titleAlign: "middle" as never }),
      ).toThrow("picoprint titleAlign must be one of:");
      expect(() => code("const x = 1;", { lineNumbers: "yes" as never })).toThrow(
        "picoprint lineNumbers must be a boolean",
      );
      expect(() => code("const x = 1;", { frame: true, padding: -1 })).toThrow(
        "picoprint padding must be a non-negative integer",
      );
      expect(() => code("const x = 1;", { frame: true, width: "wide" as never })).toThrow(
        "picoprint width must be a non-negative integer",
      );
      expect(() => code("const x = 1;", { frame: true, width: 2 })).toThrow(
        "picoprint width must be at least 3",
      );
      expect(() => code("const x = 1;", { frame: true, width: 4, paddingX: 1 })).toThrow(
        "picoprint width must be at least 5 for paddingX 1",
      );
      expect(() => code("const x = 1;", { frame: true, width: 3, lineNumbers: true })).toThrow(
        "picoprint width must be at least 6 when lineNumbers is true",
      );
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("line numbers", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should add line numbers when enabled", () => {
      const multilineCode = `line1
line2
line3`;
      code(multilineCode, { lineNumbers: true });

      const output = logOutput.join("\n");
      expect(output).toContain("1 │");
      expect(output).toContain("2 │");
      expect(output).toContain("3 │");
    });

    it("should pad line numbers correctly for multi-digit counts", () => {
      const lines = Array.from({ length: 12 }, (_, i) => `line${i + 1}`).join("\n");
      code(lines, { lineNumbers: true });

      const output = logOutput.join("\n");
      expect(output).toContain(" 1 │");
      expect(output).toContain(" 9 │");
      expect(output).toContain("10 │");
      expect(output).toContain("12 │");
    });

    it("should work with line numbers in a frame", () => {
      code("test\ncode", { frame: true, lineNumbers: true });

      const output = logOutput.join("\n");
      expect(output).toContain("1 │");
      expect(output).toContain("2 │");
      expect(output).toContain("┌");
      expect(output).toContain("└");
    });
  });

  describe("padding", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should add padding inside a frame", () => {
      code("test", { frame: true, padding: 2 });

      const lines = logOutput.map(stripAnsi);

      expect(lines.some((line) => line.includes("│  "))).toBe(true);
    });

    it("should have default padding of 0 in a frame", () => {
      code("test", { frame: true });

      const lines = logOutput.map(stripAnsi);
      expect(lines.some((line) => line.includes("│t"))).toBe(true);
      expect(lines.some((line) => line.includes("│ "))).toBe(false);
    });
  });

  describe("background colors", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should accept background color option", () => {
      code("test", { frame: true, background: colors.bgBlue });

      expect(logOutput.length).toBeGreaterThan(0);
      expect(logOutput.length).toBeGreaterThan(0);
    });

    it("should handle all supported background colors", () => {
      const bgColors = [
        colors.bgBlue,
        colors.bgCyan,
        colors.bgGray,
        colors.bgGreen,
        colors.bgMagenta,
        colors.bgRed,
        colors.bgYellow,
        colors.bgBlack,
      ];

      for (const bgColor of bgColors) {
        logOutput = [];
        code("test", { frame: true, background: bgColor });
        expect(logOutput.length).toBeGreaterThan(0);
      }
    });
  });

  describe("language options with frame and line numbers", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should support frame option with language", () => {
      code("const x = 1;", { language: "javascript", frame: true });

      const output = logOutput.join("\n");
      expect(output).toContain("┌");
      expect(output).toContain("const x = 1;");
    });

    it("should support title with language", () => {
      code("print('hello')", { language: "python", frame: true, title: "Python Example" });

      const output = logOutput.join("\n");
      expect(output).toContain("Python Example");
      expect(output).toContain("print('hello')");
    });

    it("should support line numbers with language", () => {
      code("const x: number = 1;\nconst y: number = 2;", { language: "typescript", lineNumbers: true });

      const output = logOutput.join("\n");
      expect(output).toContain("1 │");
      expect(output).toContain("2 │");
    });
  });

  describe("width option", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should respect custom width", () => {
      code("test", { frame: true, width: 40 });

      const topBorder = logOutput[0];
      if (topBorder) {
        // eslint-disable-next-line no-control-regex
        const strippedLength = topBorder.replace(/\u001b\[[\d;]*m/g, "").length;
        expect(strippedLength).toBe(40);
      } else {
        expect(topBorder).toBeDefined();
      }
    });
  });

  describe("integration tests", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should combine multiple options", () => {
      code("function test() {\n  return 42;\n}", {
        language: "javascript",
        style: "double",
        title: "Test Function",
        titleAlign: "left",
        lineNumbers: true,
        padding: 2,
      });

      const output = logOutput.join("\n");
      expect(output).toContain("Test Function");
      expect(output).toContain("╔");
      expect(output).toContain("1 │");
      expect(output).toContain("2 │");
      expect(output).toContain("function test()");
    });

    it("should handle edge case of very narrow width", () => {
      code("x", { frame: true, width: 10 });

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("x");
    });
  });
});
