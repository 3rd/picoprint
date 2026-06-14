import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  bgColor256,
  bgHex,
  bgRgb,
  color256,
  type ColorFunction,
  colors,
  createColorPalette,
  createColors,
  getColorKind,
  getTypeColor,
  gradient,
  gradientHex,
  gradientRgb,
  hex,
  hexToRgb,
  isColorSupported,
  rainbow,
  rgb,
  rgbToHex,
} from "./colors";

describe("colors", () => {
  const enabledColors = createColors(true);
  let originalForceColor: string | undefined;
  let originalNoColor: string | undefined;
  let originalTerm: string | undefined;

  beforeEach(() => {
    originalForceColor = process.env.FORCE_COLOR;
    originalNoColor = process.env.NO_COLOR;
    originalTerm = process.env.TERM;
    delete process.env.FORCE_COLOR;
    delete process.env.NO_COLOR;
    process.env.TERM = "xterm-256color";
  });

  afterEach(() => {
    process.env.FORCE_COLOR = originalForceColor;
    process.env.NO_COLOR = originalNoColor;
    process.env.TERM = originalTerm;
  });

  it("should have all color functions", () => {
    // modifiers
    expect(colors.reset).toBeTypeOf("function");
    expect(colors.bold).toBeTypeOf("function");
    expect(colors.dim).toBeTypeOf("function");
    expect(colors.italic).toBeTypeOf("function");
    expect(colors.underline).toBeTypeOf("function");
    expect(colors.inverse).toBeTypeOf("function");
    expect(colors.strikethrough).toBeTypeOf("function");

    // regular
    expect(colors.black).toBeTypeOf("function");
    expect(colors.red).toBeTypeOf("function");
    expect(colors.green).toBeTypeOf("function");
    expect(colors.yellow).toBeTypeOf("function");
    expect(colors.blue).toBeTypeOf("function");
    expect(colors.magenta).toBeTypeOf("function");
    expect(colors.cyan).toBeTypeOf("function");
    expect(colors.white).toBeTypeOf("function");
    expect(colors.gray).toBeTypeOf("function");
    expect(colors.grey).toBeTypeOf("function");

    // bright
    expect(colors.blackBright).toBeTypeOf("function");
    expect(colors.redBright).toBeTypeOf("function");
    expect(colors.greenBright).toBeTypeOf("function");
    expect(colors.yellowBright).toBeTypeOf("function");
    expect(colors.blueBright).toBeTypeOf("function");
    expect(colors.magentaBright).toBeTypeOf("function");
    expect(colors.cyanBright).toBeTypeOf("function");
    expect(colors.whiteBright).toBeTypeOf("function");

    // background
    expect(colors.bgBlack).toBeTypeOf("function");
    expect(colors.bgRed).toBeTypeOf("function");
    expect(colors.bgGreen).toBeTypeOf("function");
    expect(colors.bgYellow).toBeTypeOf("function");
    expect(colors.bgBlue).toBeTypeOf("function");
    expect(colors.bgMagenta).toBeTypeOf("function");
    expect(colors.bgCyan).toBeTypeOf("function");
    expect(colors.bgWhite).toBeTypeOf("function");
    expect(colors.bgGray).toBeTypeOf("function");
    expect(colors.bgGrey).toBeTypeOf("function");

    // bright background
    expect(colors.bgBlackBright).toBeTypeOf("function");
    expect(colors.bgRedBright).toBeTypeOf("function");
    expect(colors.bgGreenBright).toBeTypeOf("function");
    expect(colors.bgYellowBright).toBeTypeOf("function");
    expect(colors.bgBlueBright).toBeTypeOf("function");
    expect(colors.bgMagentaBright).toBeTypeOf("function");
    expect(colors.bgCyanBright).toBeTypeOf("function");
    expect(colors.bgWhiteBright).toBeTypeOf("function");
  });

  it("should apply colors", () => {
    const result = enabledColors.red("test");
    expect(result).toContain("\u001b[31m");
    expect(result).toContain("test");
    expect(result).toContain("\u001b[39m");
  });

  it("should brand foreground and background color helpers", () => {
    expect(getColorKind(colors.red)).toBe("fg");
    expect(getColorKind(colors.bgBlue)).toBe("bg");
    expect(getColorKind(color256(12))).toBe("fg");
    expect(getColorKind(bgColor256(12))).toBe("bg");
    expect(getColorKind(rgb(1, 2, 3))).toBe("fg");
    expect(getColorKind(bgRgb(1, 2, 3))).toBe("bg");
    expect(getColorKind(hex("#000000"))).toBe("fg");
    expect(getColorKind(bgHex("#000000"))).toBe("bg");
  });

  it("should keep disabled color helpers independently branded", () => {
    const disabled = createColors(false);

    expect(getColorKind(disabled.red)).toBe("fg");
    expect(getColorKind(disabled.bgBlue)).toBe("bg");
    expect(disabled.red("test")).toBe("test");
    expect(disabled.bgBlue("test")).toBe("test");
  });

  it("should evaluate default color support when colors are applied", () => {
    process.env.NO_COLOR = "1";
    const dynamicColors = createColors();

    expect(colors.red("test")).toBe("test");
    expect(dynamicColors.red("test")).toBe("test");

    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = "1";

    expect(colors.red("test")).toBe("\u001b[31mtest\u001b[39m");
    expect(dynamicColors.red("test")).toBe("\u001b[31mtest\u001b[39m");
  });

  it("should keep explicitly enabled and disabled color sets fixed", () => {
    const enabled = createColors(true);
    const disabled = createColors(false);

    process.env.NO_COLOR = "1";
    expect(enabled.red("test")).toBe("\u001b[31mtest\u001b[39m");
    expect(disabled.red("test")).toBe("test");

    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = "1";
    expect(enabled.red("test")).toBe("\u001b[31mtest\u001b[39m");
    expect(disabled.red("test")).toBe("test");
  });

  it("should evaluate generated color helper support when colors are applied", () => {
    process.env.NO_COLOR = "1";
    const fg256 = color256(196);
    const bg256 = bgColor256(196);
    const fgRgb = rgb(255, 0, 128);
    const bgRgbColor = bgRgb(255, 0, 128);
    const fgHex = hex("#ff0080");
    const bgHexColor = bgHex("#ff0080");

    expect(fg256("test")).toBe("test");
    expect(bg256("test")).toBe("test");
    expect(fgRgb("test")).toBe("test");
    expect(bgRgbColor("test")).toBe("test");
    expect(fgHex("test")).toBe("test");
    expect(bgHexColor("test")).toBe("test");

    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = "1";

    expect(fg256("test")).toBe("\u001b[38;5;196mtest\u001b[39m");
    expect(bg256("test")).toBe("\u001b[48;5;196mtest\u001b[49m");
    expect(fgRgb("test")).toBe("\u001b[38;2;255;0;128mtest\u001b[39m");
    expect(bgRgbColor("test")).toBe("\u001b[48;2;255;0;128mtest\u001b[49m");
    expect(fgHex("test")).toBe("\u001b[38;2;255;0;128mtest\u001b[39m");
    expect(bgHexColor("test")).toBe("\u001b[48;2;255;0;128mtest\u001b[49m");
  });

  describe("isColorSupported", () => {
    it("should return false when NO_COLOR is set", () => {
      process.env.NO_COLOR = "1";
      expect(isColorSupported()).toBe(false);
    });

    it("should return false when TERM is dumb", () => {
      process.env.TERM = "dumb";
      expect(isColorSupported()).toBe(false);
    });

    it("should return true when TTY and TERM is not dumb", () => {
      process.env.TERM = "xterm";
      const originalIsTTY = process.stdout?.isTTY;
      if (process.stdout) {
        Object.defineProperty(process.stdout, "isTTY", {
          value: true,
          configurable: true,
        });
      }
      expect(isColorSupported()).toBe(true);
      if (process.stdout) {
        Object.defineProperty(process.stdout, "isTTY", {
          value: originalIsTTY,
          configurable: true,
        });
      }
    });
  });

  describe("256 colors", () => {
    it("should apply 256 color", () => {
      process.env.FORCE_COLOR = "1";
      const colorFn = color256(196);
      const result = colorFn("test");
      expect(result).toBe("\u001b[38;5;196mtest\u001b[39m");
      delete process.env.FORCE_COLOR;
    });

    it("should apply 256 background color", () => {
      process.env.FORCE_COLOR = "1";
      const colorFn = bgColor256(196);
      const result = colorFn("test");
      expect(result).toBe("\u001b[48;5;196mtest\u001b[49m");
      delete process.env.FORCE_COLOR;
    });

    it("should throw error for invalid color256 code", () => {
      expect(() => color256(-1)).toThrow("picoprint color256 code must be an integer from 0 to 255, got -1");
      expect(() => color256(256)).toThrow("picoprint color256 code must be an integer from 0 to 255, got 256");
      expect(() => color256(1.5)).toThrow("picoprint color256 code must be an integer from 0 to 255, got 1.5");
      expect(() => color256(Number.NaN)).toThrow(
        "picoprint color256 code must be an integer from 0 to 255, got NaN",
      );
      expect(() => color256("1" as unknown as number)).toThrow("picoprint color256 code must be a number");
    });

    it("should throw error for invalid bgColor256 code", () => {
      expect(() => bgColor256(-1)).toThrow("picoprint bgColor256 code must be an integer from 0 to 255, got -1");
      expect(() => bgColor256(256)).toThrow("picoprint bgColor256 code must be an integer from 0 to 255, got 256");
    });

    it("should handle boundary values for color256", () => {
      process.env.FORCE_COLOR = "1";
      const color0 = color256(0);
      const color255 = color256(255);
      expect(color0("test")).toBe("\u001b[38;5;0mtest\u001b[39m");
      expect(color255("test")).toBe("\u001b[38;5;255mtest\u001b[39m");
    });

    it("should handle boundary values for bgColor256", () => {
      process.env.FORCE_COLOR = "1";
      const color0 = bgColor256(0);
      const color255 = bgColor256(255);
      expect(color0("test")).toBe("\u001b[48;5;0mtest\u001b[49m");
      expect(color255("test")).toBe("\u001b[48;5;255mtest\u001b[49m");
    });
  });

  describe("RGB colors", () => {
    it("should apply RGB color", () => {
      process.env.FORCE_COLOR = "1";
      const colorFn = rgb(255, 0, 128);
      const result = colorFn("test");
      expect(result).toBe("\u001b[38;2;255;0;128mtest\u001b[39m");
    });

    it("should apply RGB background color", () => {
      process.env.FORCE_COLOR = "1";
      const colorFn = bgRgb(255, 0, 128);
      const result = colorFn("test");
      expect(result).toBe("\u001b[48;2;255;0;128mtest\u001b[49m");
    });

    it("should throw error for invalid RGB values", () => {
      expect(() => rgb(-1, 0, 0)).toThrow("picoprint rgb r must be an integer from 0 to 255, got -1");
      expect(() => rgb(0, -1, 0)).toThrow("picoprint rgb g must be an integer from 0 to 255, got -1");
      expect(() => rgb(0, 0, -1)).toThrow("picoprint rgb b must be an integer from 0 to 255, got -1");
      expect(() => rgb(256, 0, 0)).toThrow("picoprint rgb r must be an integer from 0 to 255, got 256");
      expect(() => rgb(0, 256, 0)).toThrow("picoprint rgb g must be an integer from 0 to 255, got 256");
      expect(() => rgb(0, 0, 256)).toThrow("picoprint rgb b must be an integer from 0 to 255, got 256");
      expect(() => rgb(1.5, 0, 0)).toThrow("picoprint rgb r must be an integer from 0 to 255, got 1.5");
      expect(() => rgb(Number.NaN, 0, 0)).toThrow(
        "picoprint rgb r must be an integer from 0 to 255, got NaN",
      );
      expect(() => rgb("1" as unknown as number, 0, 0)).toThrow("picoprint rgb r must be a number");
    });

    it("should throw error for invalid bgRgb values", () => {
      expect(() => bgRgb(-1, 0, 0)).toThrow("picoprint bgRgb r must be an integer from 0 to 255, got -1");
      expect(() => bgRgb(0, -1, 0)).toThrow("picoprint bgRgb g must be an integer from 0 to 255, got -1");
      expect(() => bgRgb(0, 0, -1)).toThrow("picoprint bgRgb b must be an integer from 0 to 255, got -1");
      expect(() => bgRgb(256, 0, 0)).toThrow("picoprint bgRgb r must be an integer from 0 to 255, got 256");
      expect(() => bgRgb(0, 256, 0)).toThrow("picoprint bgRgb g must be an integer from 0 to 255, got 256");
      expect(() => bgRgb(0, 0, 256)).toThrow("picoprint bgRgb b must be an integer from 0 to 255, got 256");
    });

    it("should handle boundary RGB values", () => {
      process.env.FORCE_COLOR = "1";
      const black = rgb(0, 0, 0);
      const white = rgb(255, 255, 255);
      expect(white("test")).toBe("\u001b[38;2;255;255;255mtest\u001b[39m");
      expect(black("test")).toBe("\u001b[38;2;0;0;0mtest\u001b[39m");
    });
  });

  describe("Hex colors", () => {
    it("should convert hex to RGB", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("should return null for invalid hex", () => {
      expect(hexToRgb("invalid")).toBeNull();
      expect(hexToRgb("#gg0000")).toBeNull();
      expect(hexToRgb("#ff00")).toBeNull();
      expect(hexToRgb("")).toBeNull();
    });

    it("should convert RGB to hex", () => {
      expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
      expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
      expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
      expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
      expect(rgbToHex(0, 0, 0)).toBe("#000000");
      expect(rgbToHex(128, 128, 128)).toBe("#808080");
    });

    it("should apply hex color", () => {
      process.env.FORCE_COLOR = "1";
      const colorFn = hex("#ff0080");
      const result = colorFn("test");
      expect(result).toBe("\u001b[38;2;255;0;128mtest\u001b[39m");
    });

    it("should apply hex background color", () => {
      process.env.FORCE_COLOR = "1";
      const colorFn = bgHex("#ff0080");
      const result = colorFn("test");
      expect(result).toBe("\u001b[48;2;255;0;128mtest\u001b[49m");
    });

    it("should throw error for invalid hex color", () => {
      expect(() => hex("invalid")).toThrow("picoprint hex color must be a 6-digit hex color, got invalid");
      expect(() => hex("#gg0000")).toThrow("picoprint hex color must be a 6-digit hex color, got #gg0000");
      expect(() => hex(123 as unknown as string)).toThrow("picoprint hex color must be a string");
    });

    it("should throw error for invalid bgHex color", () => {
      expect(() => bgHex("invalid")).toThrow("picoprint bgHex color must be a 6-digit hex color, got invalid");
      expect(() => bgHex("#gg0000")).toThrow("picoprint bgHex color must be a 6-digit hex color, got #gg0000");
      expect(() => bgHex(123 as unknown as string)).toThrow("picoprint bgHex color must be a string");
    });
  });

  describe("getTypeColor", () => {
    it("should return correct color for each type", () => {
      expect(getTypeColor("string")).toBe(colors.green);
      expect(getTypeColor("number")).toBe(colors.yellow);
      expect(getTypeColor("bigint")).toBe(colors.yellow);
      expect(getTypeColor("boolean")).toBe(colors.magenta);
      expect(getTypeColor("null")).toBe(colors.gray);
      expect(getTypeColor("undefined")).toBe(colors.gray);
      expect(getTypeColor("symbol")).toBe(colors.magenta);
      expect(getTypeColor("function")).toBe(colors.blueBright);
      expect(getTypeColor("date")).toBe(colors.cyan);
      expect(getTypeColor("regexp")).toBe(colors.magenta);
      expect(getTypeColor("error")).toBe(colors.red);
      expect(getTypeColor("array")).toBe(colors.cyan);
      expect(getTypeColor("object")).toBe(colors.cyan);
      expect(getTypeColor("unknown")).toBe(colors.reset);
    });
  });

  describe("rainbow", () => {
    it("should apply rainbow colors to text", () => {
      process.env.FORCE_COLOR = "1";
      const result = rainbow("Hello World!");
      expect(result).toContain("\u001b[31m"); // red
      expect(result).toContain("\u001b[33m"); // yellow
      expect(result).toContain("\u001b[32m"); // green
      expect(result).toContain("\u001b[36m"); // cyan
      expect(result).toContain("\u001b[34m"); // blue
      expect(result).toContain("\u001b[35m"); // magenta
    });

    it("should preserve spaces", () => {
      const result = rainbow("a b");
      expect(result).toContain(" ");
    });

    it("should handle empty string", () => {
      const result = rainbow("");
      expect(result).toBe("");
    });

    it("should handle single character", () => {
      process.env.FORCE_COLOR = "1";
      const result = rainbow("h");
      expect(result).toBe("\u001b[31mh\u001b[39m");
    });

    it("should throw stable errors for invalid text", () => {
      expect(() => rainbow(12 as unknown as string)).toThrow("picoprint rainbow text must be a string");
    });
  });

  describe("gradient", () => {
    it("should apply smooth gradient between two colors", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradient("Hello World", enabledColors.red, enabledColors.blue);
      expect(result).toContain("\u001b[38;2;255;0;0m");
      expect(result).toContain("\u001b[38;2;0;0;255m");
      expect(result).toContain("\u001b[38;2;");

      // eslint-disable-next-line no-control-regex
      const rgbMatches = result.match(/\u001b\[38;2;(\d+);(\d+);(\d+)m/g) || [];
      expect(rgbMatches.length).toBeGreaterThan(2);
    });

    it("should handle single character", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradient("a", enabledColors.red, enabledColors.blue);
      expect(result).toBe("\u001b[38;2;255;0;0ma\u001b[39m");
    });

    it("should handle empty string", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradient("", enabledColors.red, enabledColors.blue);
      expect(result).toBe("");
    });

    it("should preserve whitespace characters", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradient("a b\tc\nd", enabledColors.red, enabledColors.blue);
      expect(result).toContain(" ");
      expect(result).toContain("\t");
      expect(result).toContain("\n");
    });

    it("should work with colors disabled", () => {
      process.env.NO_COLOR = "1";
      const result = gradient("Hello", enabledColors.red, enabledColors.blue);
      expect(result).toBe("Hello");
      delete process.env.NO_COLOR;
    });

    it("should throw stable errors for invalid inputs before checking color support", () => {
      process.env.NO_COLOR = "1";

      expect(() => gradient(12 as unknown as string, enabledColors.red, enabledColors.blue)).toThrow(
        "picoprint gradient text must be a string",
      );
      expect(() => gradient("x", "red" as unknown as ColorFunction, enabledColors.blue)).toThrow(
        "picoprint gradient start must be a function",
      );
      expect(() => gradient("x", enabledColors.red, "blue" as unknown as ColorFunction)).toThrow(
        "picoprint gradient end must be a function",
      );
    });
  });

  describe("gradientRgb", () => {
    it("should create smooth RGB gradient", () => {
      process.env.FORCE_COLOR = "1";
      const startRgb = { r: 255, g: 0, b: 0 };
      const endRgb = { r: 0, g: 0, b: 255 };
      const result = gradientRgb("ABCDE", startRgb, endRgb);

      expect(result).toContain("\u001b[38;2;255;0;0mA");
      expect(result).toContain("\u001b[38;2;0;0;255mE");
      expect(result).toContain("\u001b[38;2;128;0;128mC");
    });

    it("should handle single character", () => {
      process.env.FORCE_COLOR = "1";
      const startRgb = { r: 255, g: 0, b: 0 };
      const endRgb = { r: 0, g: 255, b: 0 };
      const result = gradientRgb("X", startRgb, endRgb);
      expect(result).toBe("\u001b[38;2;255;0;0mX\u001b[39m");
    });

    it("should handle empty string", () => {
      const startRgb = { r: 255, g: 0, b: 0 };
      const endRgb = { r: 0, g: 255, b: 0 };
      const result = gradientRgb("", startRgb, endRgb);
      expect(result).toBe("");
    });

    it("should throw stable errors for invalid RGB endpoints", () => {
      expect(() =>
        gradientRgb(12 as unknown as string, { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }),
      ).toThrow("picoprint gradientRgb text must be a string");
      expect(() => gradientRgb("x", { r: 256, g: 0, b: 0 }, { r: 0, g: 0, b: 0 })).toThrow(
        "picoprint gradientRgb start.r must be an integer from 0 to 255, got 256",
      );
      expect(() => gradientRgb("x", null as unknown as { r: number; g: number; b: number }, { r: 0, g: 0, b: 0 })).toThrow(
        "picoprint gradientRgb start must be an object with r, g, and b",
      );
    });

    it("should preserve spaces", () => {
      process.env.FORCE_COLOR = "1";
      const startRgb = { r: 255, g: 0, b: 0 };
      const endRgb = { r: 0, g: 255, b: 0 };
      const result = gradientRgb("a b c", startRgb, endRgb);
      expect(result).toContain(" ");
      expect(result.split(" ").length).toBe(3);
    });

    it("should work with grayscale gradient", () => {
      process.env.FORCE_COLOR = "1";
      const startRgb = { r: 0, g: 0, b: 0 };
      const endRgb = { r: 255, g: 255, b: 255 };
      const result = gradientRgb("shade", startRgb, endRgb);
      expect(result).toContain("\u001b[38;2;0;0;0ms");
      expect(result).toContain("\u001b[38;2;255;255;255me");
    });
  });

  describe("gradientHex", () => {
    it("should create gradient from hex colors", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradientHex("Rainbow", "#FF0000", "#0000FF");
      expect(result).toContain("\u001b[38;2;255;0;0mR");
      expect(result).toContain("\u001b[38;2;0;0;255mw");
    });

    it("should handle hex without hash", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradientHex("Test", "00FF00", "FF00FF");
      expect(result).toContain("\u001b[38;2;0;255;0mT");
      expect(result).toContain("\u001b[38;2;255;0;255mt");
    });

    it("should throw error for invalid start hex", () => {
      expect(() => gradientHex(12 as unknown as string, "#FF0000", "#0000FF")).toThrow(
        "picoprint gradientHex text must be a string",
      );
      expect(() => gradientHex("test", "invalid", "#0000FF")).toThrow(
        "picoprint gradientHex start must be a 6-digit hex color, got invalid",
      );
    });

    it("should throw error for invalid end hex", () => {
      expect(() => gradientHex("test", "#FF0000", "invalid")).toThrow(
        "picoprint gradientHex end must be a 6-digit hex color, got invalid",
      );
      expect(() => gradientHex("test", 123 as unknown as string, "#0000FF")).toThrow(
        "picoprint gradientHex start must be a string",
      );
    });

    it("should handle single character", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradientHex("X", "#FF0000", "#00FF00");
      expect(result).toBe("\u001b[38;2;255;0;0mX\u001b[39m");
    });

    it("should handle empty string", () => {
      const result = gradientHex("", "#FF0000", "#00FF00");
      expect(result).toBe("");
    });

    it("should create smooth transition", () => {
      process.env.FORCE_COLOR = "1";
      const result = gradientHex("12345", "#000000", "#FFFFFF");
      expect(result).toContain("\u001b[38;2;0;0;0m1");
      expect(result).toContain("\u001b[38;2;64;64;64m2");
      expect(result).toContain("\u001b[38;2;128;128;128m3");
      expect(result).toContain("\u001b[38;2;191;191;191m4");
      expect(result).toContain("\u001b[38;2;255;255;255m5");
    });
  });

  describe("createColorPalette", () => {
    it("should create a color palette", () => {
      const palette = createColorPalette("#ff0000", 5);
      expect(palette).toHaveLength(5);
      expect(palette[0]).toMatch(/^#[\da-f]{6}$/i);
      expect(palette[4]).toMatch(/^#[\da-f]{6}$/i);
    });

    it("should throw stable errors for invalid palette inputs", () => {
      expect(() => createColorPalette("invalid", 5)).toThrow(
        "picoprint palette color must be a 6-digit hex color, got invalid",
      );
      expect(() => createColorPalette(123 as unknown as string, 5)).toThrow(
        "picoprint palette color must be a string",
      );
      expect(() => createColorPalette("#ff0000", "5" as unknown as number)).toThrow(
        "picoprint palette count must be a number",
      );
      expect(() => createColorPalette("#ff0000", -1)).toThrow(
        "picoprint palette count must be a non-negative integer, got -1",
      );
      expect(() => createColorPalette("#ff0000", 1.5)).toThrow(
        "picoprint palette count must be a non-negative integer, got 1.5",
      );
    });

    it("should create palette with default count", () => {
      const palette = createColorPalette("#0000ff");
      expect(palette).toHaveLength(5);
    });

    it("should handle zero count", () => {
      const palette = createColorPalette("#ff0000", 0);
      expect(palette).toHaveLength(0);
    });

    it("should create lighter shades", () => {
      const palette = createColorPalette("#000000", 3);
      for (const color of palette) {
        expect(color).toMatch(/^#[\da-f]{6}$/i);
      }
    });
  });

  describe("nested colors", () => {
    it("should handle nested colors", () => {
      const result = enabledColors.red(`Red ${enabledColors.bold("bold red")} text`);
      expect(result).toContain("\u001b[31m");
      expect(result).toContain("\u001b[1m");
      expect(result).toContain("bold red");
    });

    it("should combine modifiers with colors", () => {
      const result = enabledColors.bold(enabledColors.red("bold red"));
      expect(result).toContain("\u001b[1m");
      expect(result).toContain("\u001b[31m");
      expect(result).toContain("bold red");
    });

    it("should combine background with foreground", () => {
      const result = enabledColors.bgBlue(enabledColors.white("white on blue"));
      expect(result).toContain("\u001b[44m");
      expect(result).toContain("\u001b[37m");
      expect(result).toContain("white on blue");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", () => {
      expect(enabledColors.red("")).toBe("\u001b[31m\u001b[39m");
      expect(enabledColors.bold("")).toBe("\u001b[1m\u001b[22m");
      expect(enabledColors.bgBlue("")).toBe("\u001b[44m\u001b[49m");
    });

    it("should handle null/undefined converted to string", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(enabledColors.red(null as any)).toContain("null");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(enabledColors.red(undefined as any)).toContain("undefined");
    });

    it("should handle special characters", () => {
      const special = "!@#$%^&*()[]{}|\\:;\"'<>,.?/~`±§";
      const result = enabledColors.red(special);
      expect(result).toContain(special);
    });

    it("should handle multi-line strings", () => {
      const multiline = "line1\nline2\nline3";
      const result = enabledColors.red(multiline);
      expect(result).toContain("line1");
      expect(result).toContain("line2");
      expect(result).toContain("line3");
    });

    it("should handle very long strings", () => {
      const long = "a".repeat(10_000);
      const result = enabledColors.red(long);
      expect(result).toContain(long);
    });
  });
});
