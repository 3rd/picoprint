import { describe, expect, it } from "bun:test";
import { applyTextWrapping } from "./string";

describe("applyTextWrapping", () => {
  it("should not wrap short strings", () => {
    const result = applyTextWrapping("short", 20, "  ");
    expect(result).toEqual(["short"]);
  });

  it("should wrap long strings", () => {
    const result = applyTextWrapping("this is a very long string that needs wrapping", 10, "  ");
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]?.length || 0).toBeLessThanOrEqual(20);
  });

  it("should preserve color codes", () => {
    const colored = "\u001b[32mgreen text\u001b[0m";
    const result = applyTextWrapping(colored, 5, "  ");
    expect(result[0]).toContain("\u001b[32m");
    expect(result[0]).toContain("\u001b[0m");
  });

  it("should handle quoted strings specially", () => {
    const quoted = '"this is a quoted string"';
    const result = applyTextWrapping(quoted, 10, "  ");
    expect(result[0]).toContain('"');
    const lastLine = result[result.length - 1];
    expect(lastLine).toContain('"');
  });

  it("should apply indentation to wrapped lines", () => {
    const result = applyTextWrapping("long string that needs wrapping", 10, "    ");
    expect(result.length).toBeGreaterThan(1);
    if (result.length > 1 && result[1]) {
      expect(result[1]).toStartWith("    ");
    }
  });

  it("should handle empty string", () => {
    const result = applyTextWrapping("", 10, "  ");
    expect(result).toEqual([""]);
  });

  it("should handle strings with exactly maxWidth length", () => {
    const result = applyTextWrapping("exact", 5, "  ");
    expect(result).toEqual(["exact"]);
  });

  it("should handle quoted strings with colors", () => {
    const colored = '\u001b[32m"green quoted text"\u001b[0m';
    const result = applyTextWrapping(colored, 10, "  ");
    expect(result[0]).toContain("\u001b[32m");
    expect(result[0]).toContain('"');
  });

  it("should wrap non-quoted strings with colors", () => {
    const colored = "\u001b[31mred text that is very long and needs wrapping\u001b[0m";
    const result = applyTextWrapping(colored, 10, "  ");
    expect(result.length).toBeGreaterThan(1);
    for (const line of result) {
      expect(line).toContain("\u001b[31m");
      expect(line).toContain("\u001b[0m");
    }
  });

  it("should handle very long quoted strings", () => {
    const longQuoted = `"${"a".repeat(100)}"`;
    const result = applyTextWrapping(longQuoted, 20, "  ");
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toContain('"');
    const lastLine = result[result.length - 1];
    expect(lastLine).toContain('"');
  });
});
