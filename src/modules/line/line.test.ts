import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { line, LineOptions } from "./line";

describe("line module", () => {
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

  describe("line", () => {
    it("should draw a basic line with default settings", () => {
      line();

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
      expect(output).toContain("─");
    });

    it("should handle string parameter as label", () => {
      line("Test Label");

      expect(logSpy).toHaveBeenCalledTimes(1);
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
      line({ label: "Left", align: "left", width: 20 });

      const output = logOutput[0];
      expect(output).toContain("Left");
      expect(output).toContain("├");
    });

    it("should align label to right", () => {
      line({ label: "Right", align: "right", width: 20 });

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

      expect(logSpy).toHaveBeenCalledTimes(1);
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

    it("should draw rounded line via helper", () => {
      line.rounded();

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("─");
    });

    it("should draw gradient line (required colors)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      line.gradient({ start: String as any, end: String as any });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
      expect(output?.length).toBeGreaterThan(0);
    });

    it("should draw gradient with custom start/end colors", () => {
      const wrapA = (s: string) => `[A]${s}`;
      const wrapB = (s: string) => `[B]${s}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      line.gradient({ start: wrapA as any, end: wrapB as any });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0] ?? "";
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe("custom separators", () => {
    it("should handle separator as false (no separators)", () => {
      line({ label: "No Separators", separator: false });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("No Separators");
      expect(output).not.toContain("├");
      expect(output).not.toContain("┤");
    });

    it("should handle separator as string (same for both sides)", () => {
      line({ label: "Custom Sep", separator: "|" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("Custom Sep");
      expect(output).toContain("|");
    });

    it("should handle separator as object (different left/right)", () => {
      line({ label: "Different Seps", separator: { left: "[", right: "]" } });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("Different Seps");
      expect(output).toContain("[");
      expect(output).toContain("]");
    });

    it("should use default separators for single style when not specified", () => {
      line({ label: "Default Single", style: "single" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("Default Single");
      expect(output).toContain("├");
      expect(output).toContain("┤");
    });

    it("should have separators by default for dashed style", () => {
      line({ label: "Dashed Default", style: "dashed" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("Dashed Default");
      expect(output).toContain("├");
      expect(output).toContain("┤");
    });

    it("should allow custom separators with any style", () => {
      line({ label: "Dashed Custom", style: "dashed", separator: "~" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("Dashed Custom");
      expect(output).toContain("~");
    });
  });

  describe("edge cases", () => {
    it("should handle zero width", () => {
      line({ width: 0 });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle negative width", () => {
      line({ width: -10 });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle very long labels", () => {
      const longLabel = "This is a very long label that might exceed the available width";
      line({ label: longLabel, width: 30 });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain(longLabel);
    });

    it("should handle empty label", () => {
      line({ label: "" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle labels with ANSI codes", () => {
      const coloredLabel = "\u001b[31mRed Label\u001b[0m";
      line({ label: coloredLabel });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toContain("Red Label");
    });

    it("should handle undefined options", () => {
      line(undefined as unknown as LineOptions);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });

    it("should handle null options", () => {
      line(null as unknown as LineOptions);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = logOutput[0];
      expect(output).toBeDefined();
    });
  });
});
