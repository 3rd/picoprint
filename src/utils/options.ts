export const ALIGN_VALUES = ["center", "left", "right"] as const;

export const isOptionsObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!isOptionsObject(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export function assertOptionsObject(
  value: unknown,
  optionName: string,
): asserts value is Record<string, unknown> {
  if (value === undefined) return;
  if (!isOptionsObject(value)) throw new TypeError(`picoprint ${optionName} must be an object`);
}

export function assertPlainOptionsObject(
  value: unknown,
  optionName: string,
): asserts value is Record<string, unknown> {
  if (value === undefined) return;
  assertOptionsObject(value, optionName);
  if (!isPlainRecord(value)) throw new TypeError(`picoprint ${optionName} must be an object`);
}

export const assertBooleanOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (typeof value !== "boolean") throw new TypeError(`picoprint ${optionName} must be a boolean`);
};

export const assertStringOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (typeof value !== "string") throw new TypeError(`picoprint ${optionName} must be a string`);
};

export const assertStringArgument = (value: unknown, argumentName: string) => {
  if (typeof value !== "string") throw new TypeError(`picoprint ${argumentName} must be a string`);
};

export function assertRecordArgument(
  value: unknown,
  argumentName: string,
): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) throw new TypeError(`picoprint ${argumentName} must be a plain object`);
}

export const assertFunctionOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (typeof value !== "function") throw new TypeError(`picoprint ${optionName} must be a function`);
};

export const assertRegExpOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (!(value instanceof RegExp)) throw new TypeError(`picoprint ${optionName} must be a RegExp`);
};

export const assertFiniteNumberOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`picoprint ${optionName} must be a finite number`);
  }
};

export const assertNonNegativeIntegerOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new RangeError(`picoprint ${optionName} must be a non-negative integer`);
  }
};

export const assertStringArrayOption = (value: unknown, optionName: string) => {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError(`picoprint ${optionName} must be string[]`);
  }
};

export const assertStringTupleOption = (value: unknown, optionName: string, length: number) => {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length !== length || value.some((item) => typeof item !== "string")) {
    throw new TypeError(`picoprint ${optionName} must be a tuple of ${length} strings`);
  }
};

export const assertEnumOption = <T extends string>(
  value: unknown,
  optionName: string,
  allowed: readonly T[],
) => {
  if (value === undefined) return;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new TypeError(`picoprint ${optionName} must be one of: ${allowed.join(", ")}`);
  }
};

export const assertStringRecordEnumOption = <T extends string>(
  value: unknown,
  optionName: string,
  allowed: readonly T[],
) => {
  if (value === undefined) return;
  assertPlainOptionsObject(value, optionName);
  for (const [key, item] of Object.entries(value)) {
    assertEnumOption(item, `${optionName}.${key}`, allowed);
  }
};
