import { describe, expect, it } from "bun:test";
import { stripAnsi } from "./ansi";
import { formatValueColored } from "./format-value";

describe("formatValueColored", () => {
  const strip = stripAnsi;

  it("formats null", () => {
    expect(strip(formatValueColored(null))).toBe("null");
  });

  it("formats undefined", () => {
    expect(strip(formatValueColored(undefined))).toBe("undefined");
  });

  it("formats booleans", () => {
    expect(strip(formatValueColored(true))).toBe("true");
    expect(strip(formatValueColored(false))).toBe("false");
  });

  it("formats numbers", () => {
    expect(strip(formatValueColored(42))).toBe("42");
    expect(strip(formatValueColored(3.14))).toBe("3.14");
  });

  it("formats bigints", () => {
    expect(strip(formatValueColored(42n))).toBe("42n");
  });

  it("formats dates", () => {
    const d = new Date("2025-01-01T00:00:00.000Z");
    expect(strip(formatValueColored(d))).toBe("2025-01-01T00:00:00.000Z");
  });

  it("formats strings without quotes by default", () => {
    expect(strip(formatValueColored("hello"))).toBe("hello");
  });

  it("formats strings with quotes when quoteStrings is true", () => {
    expect(strip(formatValueColored("hello", { quoteStrings: true }))).toBe('"hello"');
  });

  it("formats arrays as summary", () => {
    expect(strip(formatValueColored([1, 2, 3]))).toBe("[Array(3)]");
  });

  it("formats objects as summary", () => {
    expect(strip(formatValueColored({ a: 1 }))).toBe("[Object]");
  });

  it("formats unknown types via String()", () => {
    expect(strip(formatValueColored(Symbol("x")))).toBe("Symbol(x)");
  });
});
