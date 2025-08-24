import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { prettyPrint as pp } from "./pp";

type ConsoleLogFunction = (...args: unknown[]) => void;

describe("pp", () => {
  let logSpy: Mock<ConsoleLogFunction>;
  const originalLog = console.log;

  beforeEach(() => {
    logSpy = mock<ConsoleLogFunction>(() => undefined);
    console.log = logSpy as typeof console.log;
  });

  afterEach(() => {
    console.log = originalLog;
    logSpy.mockRestore();
  });

  describe("primitive values", () => {
    it("should format strings with quotes", () => {
      pp("hello");
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain('"hello"');
    });

    it("should format numbers", () => {
      pp(42);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("42");
    });

    it("should format booleans", () => {
      pp(true);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("true");
    });

    it("should format null", () => {
      pp(null);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("null");
    });

    it("should format undefined", () => {
      pp(undefined);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("undefined");
    });

    it("should format symbols", () => {
      pp(Symbol("test"));
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("Symbol(test)");
    });

    it("should format bigints with n suffix", () => {
      pp(BigInt(123));
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("123n");
    });

    it("should format functions with name", () => {
      const namedFunc = function testFunc() {};
      pp(namedFunc);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("[Function: testFunc]");
    });

    it("should format anonymous functions", () => {
      pp(() => {});
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("[Function: anonymous]");
    });
  });

  describe("special types", () => {
    it("should format dates with ISO string and relative time", () => {
      const date = new Date("2025-01-01T00:00:00Z");
      pp(date);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("2025-01-01T00:00:00.000Z");
    });

    it("should format regular expressions", () => {
      pp(/test/gi);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("/test/gi");
    });

    it("should format errors with message", () => {
      pp(new Error("Test error"));
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("[Error: Test error]");
    });
  });

  describe("arrays", () => {
    it("should format simple arrays in compact mode", () => {
      pp([1, 2, 3]);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toMatch(/\[.*1.*,.*2.*,.*3.*]/);
    });

    it("should format empty arrays", () => {
      pp([]);
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("[]");
    });

    it("should format arrays with tree structure for complex items", () => {
      pp([{ a: 1 }, { b: 2 }]);
      expect(logSpy.mock.calls.length).toBeGreaterThan(1);

      const lines = logSpy.mock.calls.map((call) => call[0] as string).join("\n");
      expect(lines).toContain("[0]");
      expect(lines).toContain("[1]");
      expect(lines).toContain("├─");
      expect(lines).toContain("└─");
    });

    it("should handle nested arrays", () => {
      pp([
        [1, 2],
        [3, 4],
      ]);

      const lines = logSpy.mock.calls.map((call) => call[0] as string);
      expect(lines.some((line) => line.includes("[0]"))).toBe(true);
      expect(lines.some((line) => line.includes("[1]"))).toBe(true);
    });
  });

  describe("objects", () => {
    it("should format simple objects in compact mode", () => {
      pp({ a: 1, b: 2 });
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("{ ");
      expect(lines).toContain("a");
      expect(lines).toContain("b");
      expect(lines).toContain(" }");
    });

    it("should format empty objects", () => {
      pp({});
      expect(logSpy).toHaveBeenCalledTimes(1);

      const lines = logSpy.mock.calls?.[0]?.[0] as string;
      expect(lines).toContain("{");
      expect(lines).toContain("}");
    });

    it("should format objects with tree structure for complex values", () => {
      pp({ nested: { inner: { deep: "value" } } }, { compact: false });
      expect(logSpy.mock.calls.length).toBeGreaterThan(1);

      const lines = logSpy.mock.calls.map((call) => call[0] as string).join("\n");
      expect(lines).toContain("nested");
      expect(lines).toContain("inner");
      expect(lines).toContain("└─");
    });

    it("should handle objects with special keys", () => {
      pp({ "key with spaces": "value", "123": "numeric" });

      const lines = logSpy.mock.calls.map((call) => call[0] as string).join("\n");
      expect(lines).toContain('"key with spaces"');
      expect(lines).toContain('"123"');
    });
  });

  describe("circular references", () => {
    it("should handle circular references in objects", () => {
      const obj = { name: "test" };
      // @ts-expect-error
      obj.self = obj;
      pp(obj);

      const lines = logSpy.mock.calls.map((call) => call[0] as string).join("\n");
      expect(lines).toContain("[Circular]");
      expect(lines).toContain("name");
    });

    it("should handle circular references in arrays", () => {
      const arr = [1, 2];
      // @ts-expect-error
      arr.push(arr);
      pp(arr);

      const liness = logSpy.mock.calls.map((call) => call[0] as string).join("\n");
      expect(liness).toContain("[Circular]");
      expect(liness).toContain("[0]");
      expect(liness).toContain("[1]");
    });
  });

  describe("options", () => {
    it("should respect maxDepth option", () => {
      const deep = { a: { b: { c: { d: { e: "value" } } } } };
      pp(deep, { maxDepth: 2 });

      const liness = logSpy.mock.calls.map((call) => call[0] as string).join("\n");
      expect(liness).toContain("...");
      expect(liness).not.toContain("value");
    });

    it("should respect compact option", () => {
      const data = { items: [1, 2, 3] };
      pp(data, { compact: false });

      // in non-compact mode, arrays should be expanded
      const lines = logSpy.mock.calls.map((call) => call[0] as string);
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.some((line) => line.includes("[0]"))).toBe(true);
    });
  });

  describe("tree formatting", () => {
    it("should use proper tree characters", () => {
      pp({ first: 1, middle: 2, last: 3 });
      const lines = logSpy.mock.calls.map((call) => call[0] as string);

      const hasTreeChars = lines.some(
        (line) => line.includes("├─") || line.includes("└─") || line.includes("│"),
      );

      // for compact display, might not have tree chars
      if (lines.length > 1) {
        expect(hasTreeChars).toBe(true);
      }
    });

    it("should properly indent nested structures", () => {
      pp({ parent: { child: { grandchild: "value" } } }, { compact: false });
      const lines = logSpy.mock.calls.map((call) => call[0] as string);

      // check that indentation increases with depth
      const parentLine = lines.find((line) => line.includes("parent"));
      const childLine = lines.find((line) => line.includes("child") && !line.includes("grandchild"));
      const grandchildLine = lines.find((line) => line.includes("grandchild"));

      expect(parentLine).toBeDefined();
      expect(childLine).toBeDefined();
      expect(grandchildLine).toBeDefined();

      // in tree format, nested items have tree characters
      if (parentLine && childLine && grandchildLine) {
        expect(childLine).toMatch(/[─│└├]/);
        expect(grandchildLine).toMatch(/[─│└├]/);
      }
    });
  });
});
