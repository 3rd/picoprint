import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { configure, resetConfig } from "@/modules/config";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { prettyPrint as pp } from "./pp";

describe("pp", () => {
  let logOutput: string[] = [];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
    resetConfig();
  });

  describe("primitive values", () => {
    it("should format strings in blue", () => {
      pp("hello");
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("hello");
    });

    it("should format numbers", () => {
      pp(42);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("42");
    });

    it("should format booleans", () => {
      pp(true);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("true");
    });

    it("should format null", () => {
      pp(null);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("null");
    });

    it("should format undefined", () => {
      pp(undefined);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("undefined");
    });

    it("should format symbols", () => {
      pp(Symbol("test"));
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("Symbol(test)");
    });

    it("should format bigints with n suffix", () => {
      pp(BigInt(123));
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("123n");
    });

    it("should format functions with name", () => {
      const namedFunc = function testFunc() {};
      pp(namedFunc);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("[Function: testFunc]");
    });

    it("should format anonymous functions", () => {
      pp(() => {});
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("[Function: anonymous]");
    });
  });

  describe("special types", () => {
    it("should format dates with ISO string and relative time", () => {
      const date = new Date("2025-01-01T00:00:00Z");
      pp(date);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("2025-01-01T00:00:00.000Z");
    });

    it("should format regular expressions", () => {
      pp(/test/gi);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("/test/gi");
    });

    it("should format errors with message", () => {
      pp(new Error("Test error"));
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("[Error: Test error]");
    });
  });

  describe("arrays", () => {
    it("should format simple arrays in compact mode", () => {
      pp([1, 2, 3]);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toMatch(/\[.*1.*,.*2.*,.*3.*]/);
    });

    it("should format empty arrays", () => {
      pp([]);
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("[]");
    });

    it("should format arrays with tree structure for complex items", () => {
      pp([{ a: 1 }, { b: 2 }]);
      expect(logOutput.length).toBeGreaterThan(1);

      const lines = logOutput.join("\n");
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

      expect(logOutput.some((line) => line.includes("[0]"))).toBe(true);
      expect(logOutput.some((line) => line.includes("[1]"))).toBe(true);
    });
  });

  describe("objects", () => {
    it("should format simple objects in compact mode", () => {
      pp({ a: 1, b: 2 });
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("{ ");
      expect(logOutput[0]).toContain("a");
      expect(logOutput[0]).toContain("b");
      expect(logOutput[0]).toContain(" }");
    });

    it("should format empty objects", () => {
      pp({});
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain("{");
      expect(logOutput[0]).toContain("}");
    });

    it("should format objects with tree structure for complex values", () => {
      pp({ nested: { inner: { deep: "value" } } }, { compact: false });
      expect(logOutput.length).toBeGreaterThan(1);

      const lines = logOutput.join("\n");
      expect(lines).toContain("nested");
      expect(lines).toContain("inner");
      expect(lines).toContain("└─");
    });

    it("should handle objects with special keys", () => {
      pp({ "key with spaces": "value", "123": "numeric" });

      const lines = logOutput.join("\n");
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

      const lines = logOutput.join("\n");
      expect(lines).toContain("[Circular]");
      expect(lines).toContain("name");
    });

    it("should handle circular references in arrays", () => {
      const arr = [1, 2];
      // @ts-expect-error
      arr.push(arr);
      pp(arr);

      const lines = logOutput.join("\n");
      expect(lines).toContain("[Circular]");
      expect(lines).toContain("[0]");
      expect(lines).toContain("[1]");
    });
  });

  describe("options via configure", () => {
    it("throws stable errors for invalid options", () => {
      expect(() => pp({ a: 1 }, null as never)).toThrow("picoprint pp options must be an object");
      expect(() => pp({ a: 1 }, new Date() as never)).toThrow(
        "picoprint pp options must be an object",
      );
      expect(() => pp({ a: 1 }, { maxDepth: -1 })).toThrow(
        "picoprint maxDepth must be a non-negative integer",
      );
      expect(() => pp({ a: 1 }, { compact: "yes" as never })).toThrow(
        "picoprint compact must be a boolean",
      );
      expect(logOutput).toHaveLength(0);
    });

    it("should respect maxDepth from config", () => {
      configure({ defaults: { maxDepth: 2 } });

      const deep = { a: { b: { c: { d: { e: "value" } } } } };
      pp(deep);

      const lines = logOutput.join("\n");
      expect(lines).toContain("...");
      expect(lines).not.toContain("value");
    });

    it("should respect compact from config", () => {
      configure({ defaults: { compact: false } });

      const data = { items: [1, 2, 3] };
      pp(data);

      // in non-compact mode, arrays should be expanded
      expect(logOutput.length).toBeGreaterThan(1);
      expect(logOutput.some((line) => line.includes("[0]"))).toBe(true);
    });
  });

  describe("tree formatting", () => {
    it("should use proper tree characters", () => {
      pp({ first: 1, middle: 2, last: 3 });

      const hasTreeChars = logOutput.some(
        (line) => line.includes("├─") || line.includes("└─") || line.includes("│"),
      );

      // for compact display, might not have tree chars
      if (logOutput.length > 1) {
        expect(hasTreeChars).toBe(true);
      }
    });

    it("should properly indent nested structures", () => {
      configure({ defaults: { compact: false } });
      pp({ parent: { child: { grandchild: "value" } } });

      // check that indentation increases with depth
      const parentLine = logOutput.find((line) => line.includes("parent"));
      const childLine = logOutput.find((line) => line.includes("child") && !line.includes("grandchild"));
      const grandchildLine = logOutput.find((line) => line.includes("grandchild"));

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

  describe("maps and sets", () => {
    it("should render Map entries in compact mode", () => {
      pp(
        new Map([
          ["x", 1],
          ["y", 2],
        ]),
      );

      const output = logOutput.join("\n");
      expect(output).toContain("Map(2)");
      expect(output).toContain("x");
      expect(output).toContain("1");
      expect(output).toContain("y");
      expect(output).toContain("2");
    });

    it("should render Set items in compact mode", () => {
      pp(new Set([1, 2, 3]));

      const output = logOutput.join("\n");
      expect(output).toContain("Set(3)");
      expect(output).toContain("1");
      expect(output).toContain("3");
    });

    it("should render Map entries as a tree when not compact", () => {
      pp(new Map([["k", { deep: { x: 1 } }]]), { compact: false });

      const output = logOutput.join("\n");
      expect(output).toContain("k");
      expect(output).toContain("deep");
      expect(output).toContain("x");
    });

    it("should render empty Map and Set distinctly", () => {
      pp(new Map(), { compact: false });
      pp(new Set(), { compact: false });

      const output = logOutput.join("\n");
      expect(output).toContain("Map(0)");
      expect(output).toContain("Set(0)");
    });
  });

  describe("options argument", () => {
    it("should enforce maxDepth from the options argument", () => {
      pp({ a: { b: { c: { d: { e: 1 } } } } }, { maxDepth: 2, compact: false });

      const output = logOutput.join("\n");
      expect(output).toContain("...");
      expect(output).not.toContain("e:");
    });

    it("should respect compact: false from the options argument", () => {
      pp({ a: 1, b: 2 }, { compact: false });

      const output = logOutput.join("\n");
      expect(output).toMatch(/[└├]/);
    });

    it("should render circular markers indented under their branch", () => {
      const value: Record<string, unknown> = { name: "n" };
      value.self = value;
      pp(value, { compact: false });

      const circularLine = logOutput.find((line) => line.includes("[Circular]"));
      expect(circularLine).toBeDefined();
      // indented under its branch, not flush-left
      expect(circularLine?.startsWith("[Circular]")).toBe(false);
    });
  });
});
