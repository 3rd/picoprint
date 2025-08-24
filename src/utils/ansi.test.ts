import { describe, expect, it } from "bun:test";
import { stripAnsi } from "./ansi";

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
