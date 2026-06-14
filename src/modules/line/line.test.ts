import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { colors } from "@/utils/colors";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { line, LineOptions } from "./line";

describe("line module", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((text) => logOutput.push(text));
  });

  afterEach(() => {
    _resetWriterStack();
  });

  describe("line", () => {
    it("should draw a basic line with default settings", () => {
      line();

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
      expect(output).toContain("─");
    });

    it("should handle string parameter as label", () => {
      line("Test Label");

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Test Label");
    });

    it("should apply single style", () => {
      line({ style: "single" });

      const output = logOutput[0];
      expect(output).toContain("─");
    });

    it("should apply double style", () => {
      line({ style: "double" });

      const output = logOutput[0];
      expect(output).toContain("═");
    });

    it("should apply thick style", () => {
      line({ style: "thick" });

      const output = logOutput[0];
      expect(output).toContain("━");
    });

    it("should apply dashed style", () => {
      line({ style: "dashed" });

      const output = logOutput[0];
      expect(output).toContain("╌");
    });

    it("should apply dotted style", () => {
      line({ style: "dotted" });

      const output = logOutput[0];
      expect(output).toContain("┅");
    });

    it("should apply rounded style", () => {
      line({ style: "rounded" });

      const output = logOutput[0];
      expect(output).toContain("─");
    });

    it("should handle custom width", () => {
      line({ width: 10 });

      const output = logOutput[0];
      // eslint-disable-next-line no-control-regex
      const cleanOutput = output?.replace(/\u001b\[[\d;]*m/g, "") || "";
      expect(cleanOutput.length).toBeLessThanOrEqual(10);
    });

    it("should align label to left", () => {
      line({ label: "Left", labelAlign: "left", width: 20 });

      const output = logOutput[0];
      expect(output).toContain("Left");
      expect(output).toContain("├");
    });

    it("should align label to right", () => {
      line({ label: "Right", labelAlign: "right", width: 20 });

      const output = logOutput[0];
      expect(output).toContain("Right");
      expect(output).toContain("├");
    });

    it("should align label to center by default", () => {
      line({ label: "Center", width: 30 });

      const output = logOutput[0];
      expect(output).toContain("Center");
    });

    it("should handle custom padding", () => {
      line({ label: "Padded", padding: 3 });

      const output = logOutput[0];
      expect(output).toContain("Padded");
    });

    it("should color labels with labelColor", () => {
      line({ label: "Colored", labelColor: (text) => `[${text}]` });

      const output = logOutput[0];
      expect(output).toContain("[Colored]");
    });

    it("should color labels with the titleColor compatibility alias", () => {
      line({ label: "Colored", titleColor: (text) => `{${text}}` });

      const output = logOutput[0];
      expect(output).toContain("{Colored}");
    });

    it("should prefer labelColor over the titleColor compatibility alias", () => {
      line({
        label: "Colored",
        labelColor: (text) => `[${text}]`,
        titleColor: (text) => `{${text}}`,
      });

      const output = logOutput[0];
      expect(output).toContain("[Colored]");
      expect(output).not.toContain("{Colored}");
    });

    it("should throw stable errors for invalid color options", () => {
      expect(() => line({ color: "cyan" as never })).toThrow(
        "picoprint color must be a function",
      );
      expect(() => line({ color: colors.bgBlue as never })).toThrow(
        "picoprint color must be a foreground color function, got a background color function",
      );
      expect(() => line({ label: "Label", labelColor: "cyan" as never })).toThrow(
        "picoprint labelColor must be a function",
      );
      expect(() => line({ label: "Label", titleColor: "cyan" as never })).toThrow(
        "picoprint titleColor must be a function",
      );
      expect(logOutput).toHaveLength(0);
    });

    it("should throw stable errors for invalid layout options", () => {
      expect(() => line(12 as never)).toThrow("picoprint line options must be an object");
      expect(() => line(null as never)).toThrow("picoprint line options must be an object");
      expect(() => line(new Date() as never)).toThrow("picoprint line options must be an object");
      expect(() => line({ width: "wide" as never })).toThrow(
        "picoprint width must be a finite number",
      );
      expect(() => line({ label: 12 as never })).toThrow("picoprint label must be a string");
      expect(() => line({ label: "Label", labelAlign: "middle" as never })).toThrow(
        "picoprint labelAlign must be one of:",
      );
      expect(() => line({ label: "Label", padding: -1 })).toThrow(
        "picoprint padding must be a non-negative integer",
      );
      expect(() => line({ label: "Label", separator: 12 as never })).toThrow(
        "picoprint separator must be a string, false, or an object",
      );
      expect(() => line({ label: "Label", separator: new Date() as never })).toThrow(
        "picoprint separator must be a string, false, or an object",
      );
      expect(() => line({ label: "Label", separator: { left: "<" } as never })).toThrow(
        "picoprint separator.right must be a string",
      );
      expect(() => line({ label: "Label", separator: { right: ">" } as never })).toThrow(
        "picoprint separator.left must be a string",
      );
      expect(() => line({ label: "Label", separator: { left: "<", right: 1 as never } })).toThrow(
        "picoprint separator.right must be a string",
      );
      expect(logOutput).toHaveLength(0);
    });

    it("should handle labels with join characters for all styles", () => {
      line({ label: "Test", style: "single" });
      const singleOutput = logOutput[0];
      expect(singleOutput).toContain("┤");
      expect(singleOutput).toContain("├");

      logOutput = [];
      line({ label: "Test", style: "double" });
      const doubleOutput = logOutput[0];
      expect(doubleOutput).toContain("╣");
      expect(doubleOutput).toContain("╠");

      logOutput = [];
      line({ label: "Test", style: "thick" });
      const thickOutput = logOutput[0];
      expect(thickOutput).toContain("┫");
      expect(thickOutput).toContain("┣");

      logOutput = [];
      line({ label: "Test", style: "dashed" });
      const dashedOutput = logOutput[0];
      expect(dashedOutput).toContain("┤");
      expect(dashedOutput).toContain("├");
    });
  });

  describe("convenience methods", () => {
    it("should draw thin line", () => {
      line.thin();

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("─");
    });

    it("should draw thin line with label", () => {
      line.thin("Thin Label");

      const output = logOutput[0];
      expect(output).toContain("Thin Label");
      expect(output).toContain("─");
    });

    it("should draw thick line", () => {
      line.thick();

      const output = logOutput[0];
      expect(output).toContain("━");
    });

    it("should draw thick line with label", () => {
      line.thick("Thick Label");

      const output = logOutput[0];
      expect(output).toContain("Thick Label");
      expect(output).toContain("━");
    });

    it("should draw double line", () => {
      line.double();

      const output = logOutput[0];
      expect(output).toContain("═");
    });

    it("should draw double line with label", () => {
      line.double("Double Label");

      const output = logOutput[0];
      expect(output).toContain("Double Label");
      expect(output).toContain("═");
    });

    it("should draw dashed line", () => {
      line.dashed();

      const output = logOutput[0];
      expect(output).toContain("╌");
    });

    it("should draw dashed line with label", () => {
      line.dashed("Dashed Label");

      const output = logOutput[0];
      expect(output).toContain("Dashed Label");
      expect(output).toContain("╌");
    });

    it("should draw dotted line", () => {
      line.dotted();

      const output = logOutput[0];
      expect(output).toContain("┅");
    });

    it("should draw dotted line with label", () => {
      line.dotted("Dotted Label");

      const output = logOutput[0];
      expect(output).toContain("Dotted Label");
      expect(output).toContain("┅");
    });

    it("should draw section line with label", () => {
      line.section("Section Title");

      const output = logOutput[0];
      expect(output).toContain("Section Title");
      expect(output).toContain("═");
    });

    it("should draw section line without label", () => {
      line.section();

      const output = logOutput[0];
      expect(output).toContain("═");
    });

    it("should draw rounded line via helper", () => {
      line.rounded();

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("─");
    });

    it("should draw a full-width gradient line of line characters", () => {
      line.gradient({ start: colors.red, end: colors.blue });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0] ?? "";
      const visible = stripAnsi(output);
      expect(visible.length).toBeGreaterThan(0);
      expect([...visible].every((ch) => ch === "─")).toBe(true);
    });

    it("should throw stable errors for invalid gradient colors", () => {
      expect(() => line.gradient(undefined as never)).toThrow(
        "picoprint line.gradient options must be an object",
      );
      expect(() => line.gradient(new Date() as never)).toThrow(
        "picoprint line.gradient options must be an object",
      );
      expect(() => line.gradient({ start: "red" as never, end: colors.blue })).toThrow(
        "picoprint line.gradient start must be a function",
      );
      expect(() => line.gradient({ start: colors.red, end: colors.bgBlue as never })).toThrow(
        "picoprint line.gradient end must be a foreground color function, got a background color function",
      );
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("custom separators", () => {
    it("should handle separator as false (no separators)", () => {
      line({ label: "No Separators", separator: false });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("No Separators");
      expect(output).not.toContain("├");
      expect(output).not.toContain("┤");
    });

    it("should handle separator as string (same for both sides)", () => {
      line({ label: "Custom Sep", separator: "|" });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Custom Sep");
      expect(output).toContain("|");
    });

    it("should handle separator as object (different left/right)", () => {
      line({ label: "Different Seps", separator: { left: "[", right: "]" } });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Different Seps");
      expect(output).toContain("[");
      expect(output).toContain("]");
    });

    it("should use default separators for single style when not specified", () => {
      line({ label: "Default Single", style: "single" });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Default Single");
      expect(output).toContain("├");
      expect(output).toContain("┤");
    });

    it("should have separators by default for dashed style", () => {
      line({ label: "Dashed Default", style: "dashed" });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Dashed Default");
      expect(output).toContain("├");
      expect(output).toContain("┤");
    });

    it("should allow custom separators with any style", () => {
      line({ label: "Dashed Custom", style: "dashed", separator: "~" });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Dashed Custom");
      expect(output).toContain("~");
    });
  });

  describe("edge cases", () => {
    it("should handle zero width", () => {
      line({ width: 0 });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle negative width", () => {
      line({ width: -10 });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle very long labels", () => {
      const longLabel = "This is a very long label that might exceed the available width";
      line({ label: longLabel, width: 30 });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain(longLabel);
    });

    it("should handle empty label", () => {
      line({ label: "" });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle labels with ANSI codes", () => {
      const coloredLabel = "\u001b[31mRed Label\u001b[0m";
      line({ label: coloredLabel });

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toContain("Red Label");
    });

    it("should handle undefined options", () => {
      line(undefined as unknown as LineOptions);

      expect(logOutput).toHaveLength(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

  });
});
