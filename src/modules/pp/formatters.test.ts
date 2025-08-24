import { describe, expect, it } from "bun:test";
import { isSimpleValue } from "@/utils/value-helpers";
import {
  canBeCompacted,
  formatCompactArray,
  formatCompactObject,
  formatPrimitive,
  getTreeColor,
} from "./formatters";

describe("pp/formatters", () => {
  describe("formatPrimitive", () => {
    it("should format strings with quotes", () => {
      const result = formatPrimitive("hello");
      expect(result).toContain('"hello"');
    });

    it("should format numbers", () => {
      const result = formatPrimitive(42);
      expect(result).toContain("42");
    });

    it("should format booleans", () => {
      const result = formatPrimitive(true);
      expect(result).toContain("true");
    });

    it("should format null", () => {
      const result = formatPrimitive(null);
      expect(result).toContain("null");
    });

    it("should format undefined", () => {
      const result = formatPrimitive(undefined);
      expect(result).toContain("undefined");
    });

    it("should format symbols", () => {
      const result = formatPrimitive(Symbol("test"));
      expect(result).toContain("Symbol(test)");
    });

    it("should format bigints with n suffix", () => {
      const result = formatPrimitive(BigInt(123));
      expect(result).toContain("123n");
    });

    it("should format named functions", () => {
      const testFunc = function testFunc() {};
      const result = formatPrimitive(testFunc);
      expect(result).toContain("[Function: testFunc]");
    });

    it("should format anonymous functions", () => {
      const result = formatPrimitive(() => {});
      expect(result).toContain("[Function: anonymous]");
    });

    it("should format dates with ISO string and relative time", () => {
      const date = new Date("2025-01-01T00:00:00Z");
      const result = formatPrimitive(date);
      expect(result).toContain("2025-01-01T00:00:00.000Z");
      expect(result).toContain("ago");
    });

    it("should format regular expressions", () => {
      const result = formatPrimitive(/test/gi);
      expect(result).toContain("/test/gi");
    });

    it("should format errors", () => {
      const result = formatPrimitive(new Error("Test error"));
      expect(result).toContain("[Error: Test error]");
    });

    it("should handle unknown types", () => {
      const customObj = { toString: () => "custom" };
      const result = formatPrimitive(customObj);
      expect(result).toBe("custom");
    });
  });

  describe("isSimpleValue", () => {
    it("should identify primitives as simple", () => {
      expect(isSimpleValue("string")).toBe(true);
      expect(isSimpleValue(42)).toBe(true);
      expect(isSimpleValue(true)).toBe(true);
      expect(isSimpleValue(null)).toBe(true);
      expect(isSimpleValue(undefined)).toBe(true);
      expect(isSimpleValue(Symbol("test"))).toBe(true);
      expect(isSimpleValue(BigInt(123))).toBe(true);
    });

    it("should identify special objects as simple", () => {
      expect(isSimpleValue(new Date())).toBe(true);
      expect(isSimpleValue(/regex/)).toBe(true);
      expect(isSimpleValue(new Error("error"))).toBe(true);
      expect(isSimpleValue(() => {})).toBe(true);
    });

    it("should not identify arrays as simple", () => {
      expect(isSimpleValue([])).toBe(false);
      expect(isSimpleValue([1, 2, 3])).toBe(false);
    });

    it("should not identify plain objects as simple", () => {
      expect(isSimpleValue({})).toBe(false);
      expect(isSimpleValue({ a: 1 })).toBe(false);
    });
  });

  describe("canBeCompact", () => {
    const seen = new WeakSet<object>();

    it("should allow simple values to be compact", () => {
      expect(canBeCompacted("string", seen)).toBe(true);
      expect(canBeCompacted(42, seen)).toBe(true);
      expect(canBeCompacted(true, seen)).toBe(true);
    });

    it("should allow small arrays with simple values to be compact", () => {
      expect(canBeCompacted([1, 2, 3], seen)).toBe(true);
      expect(canBeCompacted(["a", "b", "c"], seen)).toBe(true);
    });

    it("should not allow large arrays to be compact", () => {
      expect(canBeCompacted([1, 2, 3, 4, 5, 6], seen)).toBe(false);
    });

    it("should not allow arrays with complex values to be compact", () => {
      expect(canBeCompacted([{ a: 1 }, { b: 2 }], seen)).toBe(false);
      expect(
        canBeCompacted(
          [
            [1, 2],
            [3, 4],
          ],
          seen,
        ),
      ).toBe(false);
    });

    it("should not allow arrays with long strings to be compact", () => {
      const longString = "a".repeat(40);
      expect(canBeCompacted([longString], seen)).toBe(false);
    });

    it("should allow small objects with simple values to be compact", () => {
      expect(canBeCompacted({ a: 1, b: 2, c: 3 }, seen)).toBe(true);
      expect(canBeCompacted({ name: "John", age: 30 }, seen)).toBe(true);
    });

    it("should not allow large objects to be compact", () => {
      expect(canBeCompacted({ a: 1, b: 2, c: 3, d: 4, e: 5 }, seen)).toBe(false);
    });

    it("should not allow objects with complex values to be compact", () => {
      expect(canBeCompacted({ nested: { inner: 1 } }, seen)).toBe(false);
      expect(canBeCompacted({ arr: [1, 2, 3] }, seen)).toBe(false);
    });

    it("should not allow circular references to be compact", () => {
      const obj = { a: 1 };
      seen.add(obj);
      expect(canBeCompacted(obj, seen)).toBe(false);
    });

    it("should respect available width", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(canBeCompacted(arr, seen, 100)).toBe(true);
      expect(canBeCompacted(arr, seen, 10)).toBe(false);
    });
  });

  describe("formatCompactArray", () => {
    it("should format simple arrays", () => {
      const result = formatCompactArray([1, 2, 3]);
      expect(result).toContain("[");
      expect(result).toContain("]");
      expect(result).toContain("1");
      expect(result).toContain("2");
      expect(result).toContain("3");
      expect(result).toContain(",");
    });

    it("should format empty arrays", () => {
      const result = formatCompactArray([]);
      expect(result).toBe("[]");
    });

    it("should format mixed type arrays", () => {
      const result = formatCompactArray(["string", 42, true, null]);
      expect(result).toContain('"string"');
      expect(result).toContain("42");
      expect(result).toContain("true");
      expect(result).toContain("null");
    });
  });

  describe("formatCompactObject", () => {
    it("should format simple objects", () => {
      const result = formatCompactObject({ a: 1, b: 2 });
      expect(result).toContain("{ ");
      expect(result).toContain(" }");
      expect(result).toContain("a");
      expect(result).toContain("b");
      expect(result).toContain("1");
      expect(result).toContain("2");
    });

    it("should format empty objects", () => {
      const result = formatCompactObject({});
      expect(result).toBe("{  }");
    });

    it("should handle special key names", () => {
      const result = formatCompactObject({ "key with spaces": "value", "123": "num" });
      expect(result).toContain('"key with spaces"');
      expect(result).toContain('"123"');
    });

    it("should format object keys", () => {
      const result = formatCompactObject({ key: "value" });
      expect(result).toContain("key");
      expect(result).toContain("value");
    });

    it("should format mixed value types", () => {
      const result = formatCompactObject({ str: "text", num: 42, bool: true });
      expect(result).toContain('"text"');
      expect(result).toContain("42");
      expect(result).toContain("true");
    });
  });

  describe("getTreeColor", () => {
    it("should return color functions based on depth", () => {
      const color0 = getTreeColor(0);
      const color1 = getTreeColor(1);
      const color2 = getTreeColor(2);
      const color3 = getTreeColor(3);

      expect(typeof color0).toBe("function");
      expect(typeof color1).toBe("function");
      expect(typeof color2).toBe("function");
      expect(typeof color3).toBe("function");

      const test = "test";
      expect(color0(test)).toContain(test);
      expect(color1(test)).toContain(test);
    });

    it("should cycle through colors", () => {
      const color0 = getTreeColor(0);
      const color4 = getTreeColor(4);
      const color8 = getTreeColor(8);

      const test = "test";
      expect(color0(test)).toBe(color4(test));
      expect(color0(test)).toBe(color8(test));
    });
  });
});
