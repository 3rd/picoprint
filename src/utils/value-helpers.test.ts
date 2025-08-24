import { describe, expect, it } from "bun:test";
import {
  getType,
  hasProperty,
  isArray,
  isAsyncFunction,
  isBigInt,
  isBoolean,
  isDate,
  isEmpty,
  isError,
  isFinite,
  isFunction,
  isGeneratorFunction,
  isInteger,
  isIterable,
  isMap,
  isNaN,
  isNull,
  isNullish,
  isNumber,
  isObject,
  isPlainObject,
  isPrimitive,
  isPromise,
  isRegExp,
  isSafeInteger,
  isSet,
  isSimpleValue,
  isString,
  isSymbol,
  isUndefined,
  isValidDate,
  isWeakMap,
  isWeakSet,
} from "./value-helpers";

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

  describe("isPrimitive", () => {
    it("should identify primitives", () => {
      expect(isPrimitive(null)).toBe(true);
      expect(isPrimitive(undefined)).toBe(true);
      expect(isPrimitive("string")).toBe(true);
      expect(isPrimitive(123)).toBe(true);
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(Symbol("test"))).toBe(true);
      expect(isPrimitive(123n)).toBe(true);
    });

    it("should identify non-primitives", () => {
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive([])).toBe(false);
      expect(isPrimitive(() => {})).toBe(false);
      expect(isPrimitive(new Date())).toBe(false);
    });
  });

  describe("isString", () => {
    it("should identify strings", () => {
      expect(isString("")).toBe(true);
      expect(isString("hello")).toBe(true);
      expect(isString(String("test"))).toBe(true);
    });

    it("should reject non-strings", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString({})).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("should identify numbers", () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(123.456)).toBe(true);
      expect(isNumber(Number.NaN)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
    });

    it("should reject non-numbers", () => {
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber(123n)).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("should identify booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(Boolean(1))).toBe(true);
    });

    it("should reject non-booleans", () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean("true")).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
    });
  });

  describe("isNull", () => {
    it("should identify null", () => {
      expect(isNull(null)).toBe(true);
    });

    it("should reject non-null", () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull("")).toBe(false);
      expect(isNull(false)).toBe(false);
      expect(isNull({})).toBe(false);
    });
  });

  describe("isUndefined", () => {
    it("should identify undefined", () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(void 0)).toBe(true);
    });

    it("should reject non-undefined", () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined("")).toBe(false);
      expect(isUndefined(false)).toBe(false);
      expect(isUndefined({})).toBe(false);
    });
  });

  describe("isNullish", () => {
    it("should identify null and undefined", () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
    });

    it("should reject non-nullish values", () => {
      expect(isNullish(0)).toBe(false);
      expect(isNullish("")).toBe(false);
      expect(isNullish(false)).toBe(false);
      expect(isNullish([])).toBe(false);
      expect(isNullish({})).toBe(false);
    });
  });

  describe("isSymbol", () => {
    it("should identify symbols", () => {
      expect(isSymbol(Symbol("desc"))).toBe(true);
      expect(isSymbol(Symbol("test"))).toBe(true);
      expect(isSymbol(Symbol.for("test"))).toBe(true);
    });

    it("should reject non-symbols", () => {
      expect(isSymbol("symbol")).toBe(false);
      expect(isSymbol(123)).toBe(false);
      expect(isSymbol(null)).toBe(false);
      expect(isSymbol(undefined)).toBe(false);
    });
  });

  describe("isBigInt", () => {
    it("should identify bigints", () => {
      expect(isBigInt(0n)).toBe(true);
      expect(isBigInt(123n)).toBe(true);
      expect(isBigInt(-123n)).toBe(true);
      expect(isBigInt(BigInt(123))).toBe(true);
    });

    it("should reject non-bigints", () => {
      expect(isBigInt(123)).toBe(false);
      expect(isBigInt("123")).toBe(false);
      expect(isBigInt(null)).toBe(false);
      expect(isBigInt(undefined)).toBe(false);
    });
  });

  describe("isFunction", () => {
    it("should identify functions", () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
      expect(isFunction(function* () {})).toBe(true);
      expect(isFunction(Date)).toBe(true);
      expect(isFunction(Object)).toBe(true);
    });

    it("should reject non-functions", () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction([])).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction("function")).toBe(false);
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

  describe("isPlainObject", () => {
    it("should identify plain objects", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
      expect(isPlainObject(Object.create(Object.prototype))).toBe(true);
    });

    it("should reject non-plain objects", () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(/regex/)).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class CustomClass {}
      expect(isPlainObject(new CustomClass())).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should identify arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray([])).toBe(true);
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

  describe("isDate", () => {
    it("should identify dates", () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date("2024-01-01"))).toBe(true);
    });

    it("should reject non-dates", () => {
      expect(isDate(Date.now())).toBe(false);
      expect(isDate("2024-01-01")).toBe(false);
      expect(isDate({})).toBe(false);
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
    });
  });

  describe("isRegExp", () => {
    it("should identify regexps", () => {
      expect(isRegExp(/test/)).toBe(true);
      // eslint-disable-next-line prefer-regex-literals
      expect(isRegExp(new RegExp("test"))).toBe(true);
      expect(isRegExp(/test/gi)).toBe(true);
    });

    it("should reject non-regexps", () => {
      expect(isRegExp("/test/")).toBe(false);
      expect(isRegExp({})).toBe(false);
      expect(isRegExp(null)).toBe(false);
      expect(isRegExp(undefined)).toBe(false);
    });
  });

  describe("isError", () => {
    it("should identify errors", () => {
      expect(isError(new Error("error"))).toBe(true);
      expect(isError(new TypeError("error"))).toBe(true);
      expect(isError(new SyntaxError("error"))).toBe(true);
      expect(isError(new RangeError("error"))).toBe(true);
    });

    it("should reject non-errors", () => {
      expect(isError({ message: "error" })).toBe(false);
      expect(isError("error")).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });

  describe("isMap", () => {
    it("should identify maps", () => {
      expect(isMap(new Map())).toBe(true);
      expect(isMap(new Map([["key", "value"]]))).toBe(true);
    });

    it("should reject non-maps", () => {
      expect(isMap({})).toBe(false);
      expect(isMap(new WeakMap())).toBe(false);
      expect(isMap(null)).toBe(false);
      expect(isMap(undefined)).toBe(false);
    });
  });

  describe("isSet", () => {
    it("should identify sets", () => {
      expect(isSet(new Set())).toBe(true);
      expect(isSet(new Set([1, 2, 3]))).toBe(true);
    });

    it("should reject non-sets", () => {
      expect(isSet([])).toBe(false);
      expect(isSet(new WeakSet())).toBe(false);
      expect(isSet(null)).toBe(false);
      expect(isSet(undefined)).toBe(false);
    });
  });

  describe("isWeakMap", () => {
    it("should identify weakmaps", () => {
      expect(isWeakMap(new WeakMap())).toBe(true);
    });

    it("should reject non-weakmaps", () => {
      expect(isWeakMap(new Map())).toBe(false);
      expect(isWeakMap({})).toBe(false);
      expect(isWeakMap(null)).toBe(false);
      expect(isWeakMap(undefined)).toBe(false);
    });
  });

  describe("isWeakSet", () => {
    it("should identify weaksets", () => {
      expect(isWeakSet(new WeakSet())).toBe(true);
    });

    it("should reject non-weaksets", () => {
      expect(isWeakSet(new Set())).toBe(false);
      expect(isWeakSet([])).toBe(false);
      expect(isWeakSet(null)).toBe(false);
      expect(isWeakSet(undefined)).toBe(false);
    });
  });

  describe("isPromise", () => {
    it("should identify promises", () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
      // eslint-disable-next-line unicorn/no-thenable
      expect(isPromise({ then: () => {} })).toBe(true);
    });

    it("should reject non-promises", () => {
      expect(isPromise({})).toBe(false);
      // eslint-disable-next-line unicorn/no-thenable
      expect(isPromise({ then: 123 })).toBe(false);
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
      expect(isPromise(() => {})).toBe(false);
    });
  });

  describe("isAsyncFunction", () => {
    it("should identify async functions", () => {
      expect(isAsyncFunction(async () => {})).toBe(true);
      expect(isAsyncFunction(async () => {})).toBe(true);
    });

    it("should reject non-async functions", () => {
      expect(isAsyncFunction(() => {})).toBe(false);
      expect(isAsyncFunction(() => {})).toBe(false);
      expect(isAsyncFunction(function* () {})).toBe(false);
      expect(isAsyncFunction({})).toBe(false);
      expect(isAsyncFunction(null)).toBe(false);
    });
  });

  describe("isGeneratorFunction", () => {
    it("should identify generator functions", () => {
      expect(isGeneratorFunction(function* () {})).toBe(true);
    });

    it("should reject non-generator functions", () => {
      expect(isGeneratorFunction(() => {})).toBe(false);
      expect(isGeneratorFunction(() => {})).toBe(false);
      expect(isGeneratorFunction(async () => {})).toBe(false);
      expect(isGeneratorFunction({})).toBe(false);
      expect(isGeneratorFunction(null)).toBe(false);
    });
  });

  describe("isIterable", () => {
    it("should identify iterables", () => {
      expect(isIterable([])).toBe(true);
      expect(isIterable("string")).toBe(true);
      expect(isIterable(new Set())).toBe(true);
      expect(isIterable(new Map())).toBe(true);
      const customIterable = { [Symbol.iterator]: () => ({}) };
      expect(isIterable(customIterable)).toBe(true);
    });

    it("should reject non-iterables", () => {
      expect(isIterable({})).toBe(false);
      expect(isIterable(123)).toBe(false);
      expect(isIterable(null)).toBe(false);
      expect(isIterable(undefined)).toBe(false);
      expect(isIterable(() => {})).toBe(false);
    });
  });

  describe("isEmpty", () => {
    it("should identify empty values", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty("")).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty(new Map())).toBe(true);
      expect(isEmpty(new Set())).toBe(true);
    });

    it("should identify non-empty values", () => {
      expect(isEmpty("a")).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(new Map([["key", "value"]]))).toBe(false);
      expect(isEmpty(new Set([1]))).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe("hasProperty", () => {
    it("should identify properties", () => {
      const obj = { a: 1, b: undefined };
      expect(hasProperty(obj, "a")).toBe(true);
      expect(hasProperty(obj, "b")).toBe(true);
    });

    it("should reject missing properties", () => {
      const obj = { a: 1 };
      expect(hasProperty(obj, "b")).toBe(false);
      expect(hasProperty(obj, "toString")).toBe(true);
    });
  });

  describe("isValidDate", () => {
    it("should identify valid dates", () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date("2024-01-01"))).toBe(true);
      expect(isValidDate(new Date(0))).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isValidDate(new Date("invalid"))).toBe(false);
      expect(isValidDate("2024-01-01")).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });

  describe("isInteger", () => {
    it("should identify integers", () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(123)).toBe(true);
      expect(isInteger(-123)).toBe(true);
      expect(isInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it("should reject non-integers", () => {
      expect(isInteger(123.456)).toBe(false);
      expect(isInteger(Number.NaN)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
      expect(isInteger("123")).toBe(false);
      expect(isInteger(null)).toBe(false);
    });
  });

  describe("isFinite", () => {
    it("should identify finite numbers", () => {
      expect(isFinite(0)).toBe(true);
      expect(isFinite(123)).toBe(true);
      expect(isFinite(-123)).toBe(true);
      expect(isFinite(123.456)).toBe(true);
    });

    it("should reject non-finite values", () => {
      expect(isFinite(Infinity)).toBe(false);
      expect(isFinite(-Infinity)).toBe(false);
      expect(isFinite(Number.NaN)).toBe(false);
      expect(isFinite("123")).toBe(false);
      expect(isFinite(null)).toBe(false);
    });
  });

  describe("isSafeInteger", () => {
    it("should identify safe integers", () => {
      expect(isSafeInteger(0)).toBe(true);
      expect(isSafeInteger(123)).toBe(true);
      expect(isSafeInteger(-123)).toBe(true);
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isSafeInteger(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it("should reject unsafe integers", () => {
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
      expect(isSafeInteger(Number.MIN_SAFE_INTEGER - 1)).toBe(false);
      expect(isSafeInteger(123.456)).toBe(false);
      expect(isSafeInteger(Number.NaN)).toBe(false);
      expect(isSafeInteger(Infinity)).toBe(false);
      expect(isSafeInteger("123")).toBe(false);
    });
  });

  describe("isNaN", () => {
    it("should identify NaN", () => {
      expect(isNaN(Number.NaN)).toBe(true);
      expect(isNaN(Number.NaN)).toBe(true);
      // eslint-disable-next-line sonarjs/no-identical-expressions
      expect(isNaN(0 / 0)).toBe(true);
    });

    it("should reject non-NaN values", () => {
      expect(isNaN(0)).toBe(false);
      expect(isNaN(123)).toBe(false);
      expect(isNaN(Infinity)).toBe(false);
      expect(isNaN("NaN")).toBe(false);
      expect(isNaN(null)).toBe(false);
      expect(isNaN(undefined)).toBe(false);
    });
  });
});
