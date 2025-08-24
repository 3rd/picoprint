import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import {
  clearLine,
  clearScreen,
  getTerminalHeight,
  getTerminalWidth,
  hideCursor,
  moveCursor,
  showCursor,
} from "./terminal";

const DEFAULT_TERMINAL_WIDTH = 80;

type WriteFunction = (buffer: Uint8Array | string) => boolean;

describe("terminal", () => {
  let writeSpy: Mock<WriteFunction>;
  const originalColumns = process.stdout?.columns;
  const originalRows = process.stdout?.rows;

  beforeEach(() => {
    writeSpy = mock<WriteFunction>(() => true);
    if (process.stdout) {
      process.stdout.write = writeSpy as typeof process.stdout.write;
    }
  });

  afterEach(() => {
    if (!process.stdout) return;
    process.stdout.columns = originalColumns;
    process.stdout.rows = originalRows;
    writeSpy.mockRestore();
  });

  describe("getTerminalWidth", () => {
    it("should return terminal width when available", () => {
      process.stdout.columns = 120;
      expect(getTerminalWidth()).toBe(120);
    });

    it("should return default width when columns is undefined", () => {
      if (!process.stdout) return;

      // @ts-expect-error
      delete process.stdout.columns;
      expect(getTerminalWidth()).toBe(DEFAULT_TERMINAL_WIDTH);
    });

    it("should return default width when columns is 0", () => {
      if (!process.stdout) return;

      process.stdout.columns = 0;
      expect(getTerminalWidth()).toBe(DEFAULT_TERMINAL_WIDTH);
    });
  });

  describe("getTerminalHeight", () => {
    it("should return terminal height when available", () => {
      process.stdout.rows = 40;
      expect(getTerminalHeight()).toBe(40);
    });

    it("should return default height when rows is undefined", () => {
      if (!process.stdout) return;

      // @ts-expect-error
      delete process.stdout.rows;
      expect(getTerminalHeight()).toBe(24);
    });

    it("should return default height when rows is 0", () => {
      if (!process.stdout) return;

      process.stdout.rows = 0;
      expect(getTerminalHeight()).toBe(24);
    });
  });

  describe("clearLine", () => {
    it("should write clear line escape sequence", () => {
      clearLine();
      expect(writeSpy).toHaveBeenCalledWith("\r\u001b[K");
      expect(writeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearScreen", () => {
    it("should write clear screen escape sequence", () => {
      clearScreen();
      expect(writeSpy).toHaveBeenCalledWith("\u001b[2J\u001b[H");
      expect(writeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("moveCursor", () => {
    it("should write move cursor escape sequence with coordinates", () => {
      moveCursor(10, 5);
      expect(writeSpy).toHaveBeenCalledWith("\u001b[5;10H");
      expect(writeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("hideCursor", () => {
    it("should write hide cursor escape sequence", () => {
      hideCursor();
      expect(writeSpy).toHaveBeenCalledWith("\u001b[?25l");
      expect(writeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("showCursor", () => {
    it("should write show cursor escape sequence", () => {
      showCursor();
      expect(writeSpy).toHaveBeenCalledWith("\u001b[?25h");
      expect(writeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle when process.stdout is undefined", () => {
      const originalStdout = process.stdout;
      try {
        Object.defineProperty(process, "stdout", {
          value: undefined,
          configurable: true,
        });

        expect(getTerminalWidth()).toBe(DEFAULT_TERMINAL_WIDTH);
        expect(getTerminalHeight()).toBe(24);
      } finally {
        Object.defineProperty(process, "stdout", {
          value: originalStdout,
          configurable: true,
        });
      }
    });
  });
});
