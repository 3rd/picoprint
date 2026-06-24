import { afterEach, describe, expect, it } from "bun:test";
import { getTerminalWidth } from "./terminal";

const DEFAULT_TERMINAL_WIDTH = 80;

describe("terminal", () => {
  const originalColumns = process.stdout?.columns;

  afterEach(() => {
    if (!process.stdout) return;
    process.stdout.columns = originalColumns;
  });

  describe("getTerminalWidth", () => {
    it("should return terminal width when available", () => {
      process.stdout.columns = 120;
      expect(getTerminalWidth()).toBe(120);
    });

    it("should return default width when columns is undefined", () => {
      if (!process.stdout) return;

      Reflect.deleteProperty(process.stdout, "columns");
      expect(getTerminalWidth()).toBe(DEFAULT_TERMINAL_WIDTH);
    });

    it("should return default width when columns is 0", () => {
      if (!process.stdout) return;

      process.stdout.columns = 0;
      expect(getTerminalWidth()).toBe(DEFAULT_TERMINAL_WIDTH);
    });

    it("should return default width when process.stdout is undefined", () => {
      const originalStdout = process.stdout;
      try {
        Object.defineProperty(process, "stdout", {
          value: undefined,
          configurable: true,
        });

        expect(getTerminalWidth()).toBe(DEFAULT_TERMINAL_WIDTH);
      } finally {
        Object.defineProperty(process, "stdout", {
          value: originalStdout,
          configurable: true,
        });
      }
    });
  });
});
