import { stringWidth } from "../../utils/ansi";
import { getTypeColor, keyColor } from "../../utils/colors";
import { formatRelativeTime } from "../../utils/time";
import { getType, isSimpleValue } from "../../utils/value-helpers";
import * as colors from "../colors";

const MAX_COMPACT_ARRAY_LENGTH = 5;
const MAX_COMPACT_STRING_LENGTH = 30;
const MAX_COMPACT_OBJECT_KEYS = 4;
const VALID_IDENTIFIER_REGEX = /^[$A-Z_a-z][\w$]*$/;
const TREE_COLORS = [colors.dim, colors.gray, colors.dim, colors.gray] as const;

export const formatPrimitive = (value: unknown) => {
  const type = getType(value);
  const color = getTypeColor(type);

  switch (type) {
    case "string": {
      const escaped = String(value).replace(/\r\n/g, "\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n");
      return color(`"${escaped}"`);
    }
    case "bigint": {
      return color(`${value}n`);
    }
    case "function": {
      if (typeof value === "function") {
        return color(`[Function: ${value.name || "anonymous"}]`);
      }
      return String(value);
    }
    case "date": {
      if (value instanceof Date) {
        const relativeText = colors.dim(`(${formatRelativeTime(value)})`);
        return `${color(value.toISOString())} ${relativeText}`;
      }
      return String(value);
    }
    case "error": {
      if (value instanceof Error) {
        return color(`[Error: ${value.message}]`);
      }
      return String(value);
    }
    case "number":
    case "boolean":
    case "null":
    case "undefined":
    case "symbol":
    case "regexp": {
      return color(String(value));
    }
    default: {
      return String(value);
    }
  }
};

export const toEntries = (value: object): [string, unknown][] => {
  if (value instanceof Map) {
    return [...value.entries()].map(([key, val]) => [String(key), val] as [string, unknown]);
  }
  return Object.entries(value);
};

export const toItems = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return [...value];
  return null;
};

export const formatCompactArray = (arr: unknown[]) => {
  return `[${arr.map(formatPrimitive).join(", ")}]`;
};

const formatCompactEntries = (entries: [string, unknown][]) => {
  if (entries.length === 0) return "{}";
  const body = entries
    .map(([key, val]) => {
      const formattedKey = VALID_IDENTIFIER_REGEX.test(key) ? key : `"${key}"`;
      return `${keyColor(formattedKey)}: ${formatPrimitive(val)}`;
    })
    .join(", ");
  return `{ ${body} }`;
};

export const formatCompactObject = (obj: object) => formatCompactEntries(toEntries(obj));

// single compact rendering for any container (array, set, map, plain object)
export const formatCompactValue = (value: object): string => {
  if (Array.isArray(value)) return formatCompactArray(value);
  if (value instanceof Set) {
    const label = colors.cyan(`Set(${value.size})`);
    return `${label} ${formatCompactArray([...value])}`;
  }
  if (value instanceof Map) {
    const label = colors.cyan(`Map(${value.size})`);
    return `${label} ${formatCompactEntries(toEntries(value))}`;
  }
  return formatCompactObject(value);
};

export const canBeCompacted = (value: unknown, seen: WeakSet<object>, availableWidth?: number) => {
  if (isSimpleValue(value)) return true;

  const items = toItems(value);
  if (items) {
    if (items.length > MAX_COMPACT_ARRAY_LENGTH) return false;

    const allValuesAreSimple = items.every((item) => {
      if (!isSimpleValue(item)) return false;
      if (typeof item === "string" && item.length > MAX_COMPACT_STRING_LENGTH) return false;
      return true;
    });
    if (!allValuesAreSimple) return false;

    if (availableWidth !== undefined && stringWidth(formatCompactValue(value as object)) > availableWidth) {
      return false;
    }
    return true;
  }

  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) return false;

    const entries = toEntries(value);
    if (entries.length > MAX_COMPACT_OBJECT_KEYS) return false;

    const allValuesAreSimple = entries.every(([, val]) => {
      if (!isSimpleValue(val)) return false;
      if (typeof val === "string" && val.length > MAX_COMPACT_STRING_LENGTH) return false;
      return true;
    });
    if (!allValuesAreSimple) return false;

    if (availableWidth !== undefined && stringWidth(formatCompactValue(value)) > availableWidth) {
      return false;
    }
    return true;
  }

  return false;
};

export const getTreeColor = (depth: number) => {
  return TREE_COLORS[depth % TREE_COLORS.length] ?? colors.gray;
};
