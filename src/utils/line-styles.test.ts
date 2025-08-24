import { describe, expect, it } from "bun:test";
import {
  drawBox,
  drawHorizontalLine,
  drawVerticalLine,
  getAllStyleNames,
  getLineChar,
  getLineStyle,
  getTableBorderChars,
  isValidStyleName,
} from "./line-styles";

describe("line-styles", () => {
  describe("getLineStyle", () => {
    it("should return single style by default", () => {
      const style = getLineStyle();
      expect(style.horizontal).toBe("─");
      expect(style.vertical).toBe("│");
      expect(style.topLeft).toBe("┌");
      expect(style.topRight).toBe("┐");
    });

    it("should return double style", () => {
      const style = getLineStyle("double");
      expect(style.horizontal).toBe("═");
      expect(style.vertical).toBe("║");
      expect(style.topLeft).toBe("╔");
      expect(style.topRight).toBe("╗");
    });

    it("should return thick style", () => {
      const style = getLineStyle("thick");
      expect(style.horizontal).toBe("━");
      expect(style.vertical).toBe("┃");
      expect(style.topLeft).toBe("┏");
      expect(style.topRight).toBe("┓");
    });

    it("should return rounded style", () => {
      const style = getLineStyle("rounded");
      expect(style.horizontal).toBe("─");
      expect(style.vertical).toBe("│");
      expect(style.topLeft).toBe("╭");
      expect(style.topRight).toBe("╮");
    });

    it("should return ascii style", () => {
      const style = getLineStyle("ascii");
      expect(style.horizontal).toBe("-");
      expect(style.vertical).toBe("|");
      expect(style.topLeft).toBe("+");
      expect(style.cross).toBe("+");
    });

    it("should return dashed style", () => {
      const style = getLineStyle("dashed");
      expect(style.horizontal).toBe("╌");
      expect(style.vertical).toBe("╎");
    });

    it("should return dotted style", () => {
      const style = getLineStyle("dotted");
      expect(style.horizontal).toBe("┅");
      expect(style.vertical).toBe("┇");
    });

    it("should handle bold alias for thick", () => {
      const style = getLineStyle("bold");
      expect(style.horizontal).toBe("━");
      expect(style.vertical).toBe("┃");
    });

    it("should handle light alias for single", () => {
      const style = getLineStyle("light");
      expect(style.horizontal).toBe("─");
      expect(style.vertical).toBe("│");
    });
  });

  describe("getAllStyleNames", () => {
    it("should return all available style names", () => {
      const names = getAllStyleNames();
      expect(names).toContain("single");
      expect(names).toContain("double");
      expect(names).toContain("thick");
      expect(names).toContain("rounded");
      expect(names).toContain("ascii");
      expect(names).toContain("dashed");
      expect(names).toContain("dotted");
      expect(names).toContain("bold");
      expect(names).toContain("light");
      expect(names.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe("isValidStyleName", () => {
    it("should return true for valid style names", () => {
      expect(isValidStyleName("single")).toBe(true);
      expect(isValidStyleName("double")).toBe(true);
      expect(isValidStyleName("thick")).toBe(true);
      expect(isValidStyleName("ascii")).toBe(true);
    });

    it("should return false for invalid style names", () => {
      expect(isValidStyleName("invalid")).toBe(false);
      expect(isValidStyleName("")).toBe(false);
      expect(isValidStyleName("foo")).toBe(false);
    });
  });

  describe("getLineChar", () => {
    it("should return specific character from style", () => {
      expect(getLineChar("single", "horizontal")).toBe("─");
      expect(getLineChar("double", "vertical")).toBe("║");
      expect(getLineChar("thick", "topLeft")).toBe("┏");
      expect(getLineChar("ascii", "cross")).toBe("+");
    });

    it("should return empty string for invalid char type", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getLineChar("single", "invalid" as any)).toBe("");
    });
  });

  describe("drawHorizontalLine", () => {
    it("should draw horizontal line with specified width", () => {
      expect(drawHorizontalLine(5)).toBe("─────");
      expect(drawHorizontalLine(3, "double")).toBe("═══");
      expect(drawHorizontalLine(4, "thick")).toBe("━━━━");
      expect(drawHorizontalLine(6, "ascii")).toBe("------");
    });

    it("should handle zero and negative widths", () => {
      expect(drawHorizontalLine(0)).toBe("");
      expect(drawHorizontalLine(-5)).toBe("");
    });
  });

  describe("drawVerticalLine", () => {
    it("should draw vertical line array with specified height", () => {
      const lines = drawVerticalLine(3);
      expect(lines).toEqual(["│", "│", "│"]);

      const doubleLines = drawVerticalLine(2, "double");
      expect(doubleLines).toEqual(["║", "║"]);

      const asciiLines = drawVerticalLine(4, "ascii");
      expect(asciiLines).toEqual(["|", "|", "|", "|"]);
    });

    it("should handle zero and negative heights", () => {
      expect(drawVerticalLine(0)).toEqual([]);
      expect(drawVerticalLine(-3)).toEqual([]);
    });
  });

  describe("drawBox", () => {
    it("should draw a simple box", () => {
      const box = drawBox(4, 3);
      expect(box).toEqual(["┌──┐", "│  │", "└──┘"]);
    });

    it("should draw a double-style box", () => {
      const box = drawBox(5, 3, "double");
      expect(box).toEqual(["╔═══╗", "║   ║", "╚═══╝"]);
    });

    it("should draw an ascii box", () => {
      const box = drawBox(3, 2, "ascii");
      expect(box).toEqual(["+-+", "+-+"]);
    });

    it("should handle minimum size box", () => {
      const box = drawBox(2, 2);
      expect(box).toEqual(["┌┐", "└┘"]);
    });

    it("should handle zero and negative dimensions", () => {
      expect(drawBox(0, 5)).toEqual([]);
      expect(drawBox(5, 0)).toEqual([]);
      expect(drawBox(-3, -3)).toEqual([]);
    });
  });

  describe("getTableBorderChars", () => {
    it("should return default table border chars", () => {
      const chars = getTableBorderChars();
      expect(chars.horizontal).toBe("─");
      expect(chars.vertical).toBe("│");
      expect(chars.cross).toBe("┼");
    });

    it("should respect style option", () => {
      const chars = getTableBorderChars({ styleName: "double" });
      expect(chars.horizontal).toBe("═");
      expect(chars.vertical).toBe("║");
      expect(chars.cross).toBe("╬");
    });

    it("should respect showVertical option", () => {
      const chars = getTableBorderChars({ showVertical: false });
      expect(chars.vertical).toBe("");
      expect(chars.horizontal).toBe("─");
    });

    it("should respect showHorizontal option", () => {
      const chars = getTableBorderChars({ showHorizontal: false });
      expect(chars.horizontal).toBe("");
      expect(chars.vertical).toBe("│");
    });
  });
});
