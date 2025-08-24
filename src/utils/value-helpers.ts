export type PrimitiveType =
  | "bigint"
  | "boolean"
  | "function"
  | "null"
  | "number"
  | "string"
  | "symbol"
  | "undefined";

export type ComplexType =
  | "array"
  | "date"
  | "error"
  | "map"
  | "object"
  | "regexp"
  | "set"
  | "weakmap"
  | "weakset";

export type DataType = ComplexType | PrimitiveType;

export const getType = (value: unknown): DataType => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";

  const type = typeof value;

  if (type === "object") {
    if (value instanceof Date) return "date";
    if (value instanceof RegExp) return "regexp";
    if (value instanceof Error) return "error";
    if (value instanceof Map) return "map";
    if (value instanceof Set) return "set";
    if (value instanceof WeakMap) return "weakmap";
    if (value instanceof WeakSet) return "weakset";
    return "object";
  }

  return type as PrimitiveType;
};

const SIMPLE_VALUE_TYPES = new Set<DataType>([
  "bigint",
  "boolean",
  "date",
  "error",
  "function",
  "null",
  "number",
  "regexp",
  "string",
  "symbol",
  "undefined",
]);

export const isSimpleValue = (value: unknown) => {
  const type = getType(value);
  return SIMPLE_VALUE_TYPES.has(type);
};

export const isPrimitive = (value: unknown) => {
  const type = typeof value;
  return value === null || (type !== "object" && type !== "function");
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const isPlainObject = (value: unknown) => {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;

  return proto === Object.prototype || Object.getPrototypeOf(proto) === null;
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === "number";
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === "function";
};

export const isSymbol = (value: unknown): value is symbol => {
  return typeof value === "symbol";
};

export const isBigInt = (value: unknown): value is bigint => {
  return typeof value === "bigint";
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date;
};

export const isRegExp = (value: unknown): value is RegExp => {
  return value instanceof RegExp;
};

export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

export const isMap = (value: unknown): value is Map<unknown, unknown> => {
  return value instanceof Map;
};

export const isSet = (value: unknown): value is Set<unknown> => {
  return value instanceof Set;
};

export const isWeakMap = (value: unknown): value is WeakMap<object, unknown> => {
  return value instanceof WeakMap;
};

export const isWeakSet = (value: unknown): value is WeakSet<object> => {
  return value instanceof WeakSet;
};

interface PromiseLike {
  then: unknown;
}

export const isPromise = (value: unknown): value is Promise<unknown> => {
  return (
    value instanceof Promise ||
    (isObject(value) &&
      "then" in value &&
      typeof (value as PromiseLike & Record<string, unknown>).then === "function")
  );
};

export const isAsyncFunction = (value: unknown) => {
  return isFunction(value) && value.constructor.name === "AsyncFunction";
};

export const isGeneratorFunction = (value: unknown) => {
  return isFunction(value) && value.constructor.name === "GeneratorFunction";
};

interface Iterable {
  [Symbol.iterator]: unknown;
}

export const isIterable = (value: unknown) => {
  if (isNullish(value)) return false;
  if (typeof value === "string") return true;
  if (typeof value !== "object" && typeof value !== "function") return false;
  return Symbol.iterator in value && typeof (value as Iterable)[Symbol.iterator] === "function";
};

export const isEmpty = (value: unknown) => {
  if (isNullish(value)) return true;

  if (isString(value) || isArray(value)) {
    return value.length === 0;
  }

  if (isMap(value) || isSet(value)) {
    return value.size === 0;
  }

  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
};

export const hasProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): obj is Record<K, unknown> & T => {
  return key in obj;
};

export const isValidDate = (value: unknown) => {
  return isDate(value) && !Number.isNaN(value.getTime());
};

export const isInteger = (value: unknown) => {
  return isNumber(value) && Number.isInteger(value);
};

export const isFinite = (value: unknown) => {
  return isNumber(value) && Number.isFinite(value);
};

export const isSafeInteger = (value: unknown) => {
  return isNumber(value) && Number.isSafeInteger(value);
};

export const isNaN = (value: unknown) => {
  return isNumber(value) && Number.isNaN(value);
};
