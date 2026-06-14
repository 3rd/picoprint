import { describe, expect, it } from "bun:test";
import { charWidth, graphemeWidth, stringWidth, stripAnsi, truncateAnsi } from "./ansi";

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

describe("stringWidth", () => {
  it("counts ascii as one column per character", () => {
    expect(stringWidth("hello")).toBe(5);
  });

  it("ignores ansi escape sequences", () => {
    expect(stringWidth("\u001b[31mred\u001b[0m")).toBe(3);
  });

  it("counts cjk characters as two columns", () => {
    expect(stringWidth("日本語")).toBe(6);
    expect(stringWidth("ab日")).toBe(4);
  });

  it("counts emoji as two columns", () => {
    expect(stringWidth("🔥")).toBe(2);
  });

  it("counts composed emoji as a single wide grapheme", () => {
    expect(stringWidth("👍🏽")).toBe(2);
    expect(stringWidth("👨‍👩‍👧‍👦")).toBe(2);
  });

  it("counts emoji presentation sequences and dingbats as wide graphemes", () => {
    expect(stringWidth("❤")).toBe(2);
    expect(stringWidth("❤️")).toBe(2);
    expect(stringWidth("☀")).toBe(2);
    expect(stringWidth("☀️")).toBe(2);
    expect(stringWidth("✈")).toBe(2);
    expect(stringWidth("✈️")).toBe(2);
    expect(stringWidth("✔")).toBe(2);
    expect(stringWidth("✔️")).toBe(2);
  });

  it("counts zero-width characters as zero columns", () => {
    expect(stringWidth("a\u200Bb")).toBe(2);
  });
});

describe("charWidth", () => {
  it("returns 1 for ascii", () => {
    expect(charWidth("a".codePointAt(0) ?? 0)).toBe(1);
  });

  it("returns 2 for wide and emoji code points", () => {
    expect(charWidth("漢".codePointAt(0) ?? 0)).toBe(2);
    expect(charWidth("🚀".codePointAt(0) ?? 0)).toBe(2);
  });
});

describe("graphemeWidth", () => {
  it("counts composed emoji as one terminal-wide cluster", () => {
    expect(graphemeWidth("👍🏽")).toBe(2);
  });

  it("counts variation-selector emoji clusters as one wide cluster", () => {
    expect(graphemeWidth("❤️")).toBe(2);
    expect(graphemeWidth("✈️")).toBe(2);
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

  it("does not emit a stray reset for plain strings", () => {
    expect(truncateAnsi("plain text that is long", 8)).toBe("plain...");
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

  it("budgets two columns per cjk character", () => {
    const result = truncateAnsi("日本語テスト", 7);
    expect(stringWidth(result)).toBeLessThanOrEqual(7);
    expect(result.endsWith("...")).toBe(true);
  });

  it("does not split composed emoji while truncating", () => {
    const result = truncateAnsi("👍🏽👍🏽abc", 5);
    expect(stripAnsi(result)).toBe("👍🏽...");
    expect(stringWidth(result)).toBeLessThanOrEqual(5);
  });
});
