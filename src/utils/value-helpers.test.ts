import { describe, expect, it } from "bun:test";
import { getType, isArray, isObject, isSimpleValue } from "./value-helpers";

describe("value-helpers", () => {
  describe("getType", () => {
    it("should identify primitive types", () => {
      expect(getType(null)).toBe("null");
      expect(getType(undefined)).toBe("undefined");
      expect(getType("string")).toBe("string");
      expect(getType(123)).toBe("number");
      expect(getType(true)).toBe("boolean");
      expect(getType(Symbol("test"))).toBe("symbol");
      expect(getType(123n)).toBe("bigint");
      expect(getType(() => {})).toBe("function");
    });

    it("should identify complex types", () => {
      expect(getType([])).toBe("array");
      expect(getType({})).toBe("object");
      expect(getType(new Date())).toBe("date");
      expect(getType(/regex/)).toBe("regexp");
      expect(getType(new Error("error"))).toBe("error");
      expect(getType(new Map())).toBe("map");
      expect(getType(new Set())).toBe("set");
      expect(getType(new WeakMap())).toBe("weakmap");
      expect(getType(new WeakSet())).toBe("weakset");
    });
  });

  describe("isSimpleValue", () => {
    it("should identify simple values", () => {
      expect(isSimpleValue(null)).toBe(true);
      expect(isSimpleValue(undefined)).toBe(true);
      expect(isSimpleValue("string")).toBe(true);
      expect(isSimpleValue(123)).toBe(true);
      expect(isSimpleValue(true)).toBe(true);
      expect(isSimpleValue(Symbol("test"))).toBe(true);
      expect(isSimpleValue(123n)).toBe(true);
      expect(isSimpleValue(() => {})).toBe(true);
      expect(isSimpleValue(new Date())).toBe(true);
      expect(isSimpleValue(new Error("error"))).toBe(true);
      expect(isSimpleValue(/regex/)).toBe(true);
    });

    it("should identify complex values", () => {
      expect(isSimpleValue([])).toBe(false);
      expect(isSimpleValue({})).toBe(false);
      expect(isSimpleValue(new Map())).toBe(false);
      expect(isSimpleValue(new Set())).toBe(false);
      expect(isSimpleValue(new WeakMap())).toBe(false);
      expect(isSimpleValue(new WeakSet())).toBe(false);
    });
  });

  describe("isObject", () => {
    it("should identify objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(/regex/)).toBe(true);
      expect(isObject(new Map())).toBe(true);
      expect(isObject(new Set())).toBe(true);
    });

    it("should reject non-objects", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject(() => {})).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject("string")).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should identify arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(Array.from({ length: 3 }))).toBe(true);
    });

    it("should reject non-arrays", () => {
      expect(isArray({})).toBe(false);
      expect(isArray("array")).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray({ length: 0 })).toBe(false);
    });
  });
});
