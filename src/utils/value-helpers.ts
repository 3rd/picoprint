export type PrimitiveType =
  | "bigint"
  | "boolean"
  | "function"
  | "null"
  | "number"
  | "string"
  | "symbol"
  | "undefined";

type ComplexType = "array" | "date" | "error" | "map" | "object" | "regexp" | "set" | "weakmap" | "weakset";

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

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};
