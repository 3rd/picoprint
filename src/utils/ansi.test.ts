import { describe, expect, it } from "bun:test";
import { stripAnsi, truncateAnsi } from "./ansi";

describe("stripAnsi", () => {
  it("should remove ANSI color codes", () => {
    const colored = "\u001b[31mred text\u001b[0m";
    expect(stripAnsi(colored)).toBe("red text");
  });

  it("should handle multiple ANSI codes", () => {
    const colored = "\u001b[1m\u001b[32mbold green\u001b[0m\u001b[0m";
    expect(stripAnsi(colored)).toBe("bold green");
  });

  it("should handle plain text", () => {
    const plain = "plain text";
    expect(stripAnsi(plain)).toBe("plain text");
  });

  it("should handle empty string", () => {
    expect(stripAnsi("")).toBe("");
  });

  it("should handle complex ANSI sequences", () => {
    const complex = "\u001b[38;5;196mExtended color\u001b[48;2;255;0;0mRGB background\u001b[0m";
    expect(stripAnsi(complex)).toBe("Extended colorRGB background");
  });
});

describe("truncateAnsi", () => {
  it("returns string unchanged if visible length <= max", () => {
    const s = "\u001b[32mhello\u001b[0m";
    expect(truncateAnsi(s, 10)).toBe(s);
  });

  it("truncates plain text", () => {
    const result = truncateAnsi("hello world", 8);
    expect(stripAnsi(result)).toBe("hello...");
  });

  it("truncates colored text without breaking ANSI sequences", () => {
    const colored = "\u001b[32mhello world\u001b[0m";
    const result = truncateAnsi(colored, 8);
    const visible = stripAnsi(result);
    expect(visible).toBe("hello...");
    // should contain a reset before ellipsis
    expect(result).toContain("\u001b[0m...");
  });

  it("handles text with multiple ANSI sequences", () => {
    const s = "\u001b[31mred\u001b[0m \u001b[32mgreen\u001b[0m";
    const result = truncateAnsi(s, 6);
    const visible = stripAnsi(result);
    expect(visible).toBe("red...");
  });

  it("handles maxVisible smaller than ellipsis", () => {
    const result = truncateAnsi("hello", 2);
    expect(stripAnsi(result)).toBe("..");
  });

  it("handles maxVisible of zero", () => {
    const result = truncateAnsi("hello", 0);
    expect(stripAnsi(result)).toBe("");
  });
});
