import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { colors } from "../colors";
import { _resetBatCache, _setBatAvailable, code } from "./code";

describe("code", () => {
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

  describe("fallback behavior", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should display code with markdown-style fences", () => {
      code("const x = 42;", "javascript");

      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logOutput[0]).toContain("```javascript");
      expect(logOutput[1]).toBe("const x = 42;");
      expect(logOutput[2]).toContain("```");
    });

    it("should handle empty code", () => {
      code("");

      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logOutput[0]).toContain("```");
      expect(logOutput[1]).toBe("");
      expect(logOutput[2]).toContain("```");
    });

    it("should handle code without language specification", () => {
      code("function test() { return 42; }");

      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logOutput[0]).toContain("```");
      expect(logOutput[1]).toBe("function test() { return 42; }");
      expect(logOutput[2]).toContain("```");
    });

    it("should handle multi-line code", () => {
      const codeString = `function hello() {
  console.log("Hello");
}`;

      code(codeString, "javascript");

      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logOutput[0]).toContain("```javascript");
      expect(logOutput[1]).toBe(codeString);
      expect(logOutput[2]).toContain("```");
    });
  });

  describe("language argument support", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should accept language as a string argument", () => {
      code("const x = 1;", "javascript");
      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logOutput[0]).toContain("```javascript");
    });

    it("should accept language via options", () => {
      code("const x: number = 1;", { language: "typescript" });
      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logOutput[0]).toContain("```typescript");
    });
  });

  describe("window rendering", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should render code in a single-line window", () => {
      code("const x = 42;", { window: true });

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("┌");
      expect(output).toContain("┐");
      expect(output).toContain("└");
      expect(output).toContain("┘");
      expect(output).toContain("│");
      expect(output).toContain("const x = 42;");
    });

    it("should render code with double border style", () => {
      code("test", { window: "double" });

      const output = logOutput.join("\n");
      expect(output).toContain("╔");
      expect(output).toContain("╗");
      expect(output).toContain("╚");
      expect(output).toContain("╝");
      expect(output).toContain("║");
    });

    it("should render code with rounded border style", () => {
      code("test", { window: "rounded" });

      const output = logOutput.join("\n");
      expect(output).toContain("╭");
      expect(output).toContain("╮");
      expect(output).toContain("╰");
      expect(output).toContain("╯");
    });

    it("should render code with thick border style", () => {
      code("test", { window: "thick" });

      const output = logOutput.join("\n");
      expect(output).toContain("┏");
      expect(output).toContain("┓");
      expect(output).toContain("┗");
      expect(output).toContain("┛");
      expect(output).toContain("┃");
    });

    it("should handle empty code in a window", () => {
      code("", { window: true, title: "Empty" });

      const output = logOutput.join("\n");
      expect(output).toContain("Empty");
      expect(output).toContain("┌");
      expect(output).toContain("┘");
    });

    it("should handle multi-line code in a window", () => {
      const multilineCode = `line1
line2
line3`;
      code(multilineCode, { window: true });

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
      code("test", { window: true, title: "Test Title" });

      const output = logOutput.join("\n");
      expect(output).toContain("Test Title");
    });

    it("should render title aligned left", () => {
      code("test", { window: true, title: "Left", titleAlign: "left" });

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
      code("test", { window: true, title: "Right", titleAlign: "right" });

      expect(logOutput[0]).toContain("Right");
    });

    it("should truncate very long titles", () => {
      const longTitle = "A".repeat(200);
      code("test", { window: true, title: longTitle, width: 50 });

      const output = logOutput.join("\n");
      expect(output).toContain("...");
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

    it("should work with line numbers in a window", () => {
      code("test\ncode", { window: true, lineNumbers: true });

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

    it("should add padding inside window", () => {
      code("test", { window: true, padding: 2 });

      const lines = logOutput.map(stripAnsi);

      expect(lines.some((line) => line.includes("│  "))).toBe(true);
    });

    it("should have default padding of 0 in window", () => {
      code("test", { window: true });

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
      code("test", { window: true, background: colors.bgBlue });

      expect(logSpy).toHaveBeenCalled();
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
        code("test", { window: true, background: bgColor });
        expect(logOutput.length).toBeGreaterThan(0);
      }
    });
  });

  describe("language options with window/line numbers", () => {
    beforeEach(() => {
      _setBatAvailable(false);
    });

    it("should support window option with language", () => {
      code("const x = 1;", { language: "javascript", window: true });

      const output = logOutput.join("\n");
      expect(output).toContain("┌");
      expect(output).toContain("const x = 1;");
    });

    it("should support title with language", () => {
      code("print('hello')", { language: "python", window: true, title: "Python Example" });

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
      code("test", { window: true, width: 40 });

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
        window: "double",
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
      code("x", { window: true, width: 10 });

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("x");
    });
  });
});
