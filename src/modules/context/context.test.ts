import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { createContext, defaultContext } from "./context";

type ColumnsGetter = () => number | undefined;

describe("RenderContext", () => {
  const originalColumns = process.stdout?.columns;
  let mockColumns: Mock<ColumnsGetter>;

  beforeEach(() => {
    mockColumns = mock<ColumnsGetter>(() => 80);
    if (process.stdout) {
      Object.defineProperty(process.stdout, "columns", {
        get: mockColumns,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    if (process.stdout && originalColumns !== undefined) {
      Object.defineProperty(process.stdout, "columns", {
        value: originalColumns,
        configurable: true,
      });
    }
  });

  describe("createContext", () => {
    it("creates context with default offset of 0", () => {
      const ctx = createContext();
      expect(ctx.offset).toBe(0);
    });

    it("creates context with specified offset", () => {
      const ctx = createContext(10);
      expect(ctx.offset).toBe(10);
    });

    it("throws error for negative offset", () => {
      expect(() => createContext(-1)).toThrow("RenderContext offset cannot be negative");
    });
  });

  describe("getWidth", () => {
    it("returns terminal width minus offset", () => {
      const ctx = createContext(10);
      expect(ctx.getWidth()).toBe(70); // default width is 80
    });

    it("returns minimum width of 1 when offset exceeds terminal width", () => {
      const ctx = createContext(100);
      expect(ctx.getWidth()).toBe(1);
    });

    it("handles undefined terminal width", () => {
      mockColumns.mockReturnValue(undefined);
      const ctx = createContext(10);
      expect(ctx.getWidth()).toBe(70); // default width is 80
    });
  });

  describe("indent", () => {
    it("creates new context with default indent of 2", () => {
      const ctx = createContext(10);
      const nested = ctx.indent();
      expect(nested.offset).toBe(12);
      expect(ctx.offset).toBe(10);
    });

    it("creates new context with specified indent", () => {
      const ctx = createContext(10);
      const nested = ctx.indent(4);
      expect(nested.offset).toBe(14);
    });

    it("can chain multiple indents", () => {
      const ctx = createContext().indent().indent(3).indent(1);
      expect(ctx.offset).toBe(6); // 0 + 2 + 3 + 1
    });
  });

  describe("withOffset", () => {
    it("creates new context with additional offset", () => {
      const ctx = createContext(10);
      const newCtx = ctx.withOffset(5);
      expect(newCtx.offset).toBe(15);
      expect(ctx.offset).toBe(10);
    });

    it("can handle large offsets", () => {
      const ctx = createContext().withOffset(100);
      expect(ctx.offset).toBe(100);
      expect(ctx.getWidth()).toBe(1);
    });
  });

  describe("defaultContext", () => {
    it("has offset of 0", () => {
      expect(defaultContext.offset).toBe(0);
    });

    it("returns full terminal width", () => {
      expect(defaultContext.getWidth()).toBe(80);
    });
  });

  describe("nested rendering scenarios", () => {
    it("supports multiple nesting levels", () => {
      const level1 = createContext();
      const level2 = level1.indent();
      const level3 = level2.indent();
      const level4 = level3.indent();

      expect(level1.getWidth()).toBe(80);
      expect(level2.getWidth()).toBe(78);
      expect(level3.getWidth()).toBe(76);
      expect(level4.getWidth()).toBe(74);
    });

    it("handles deep nesting gracefully", () => {
      let ctx = createContext();
      for (let i = 0; i < 50; i++) {
        ctx = ctx.indent();
      }
      expect(ctx.offset).toBe(100); // 50 * 2
      expect(ctx.getWidth()).toBe(1); // Minimum width
    });
  });
});
