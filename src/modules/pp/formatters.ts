import * as colors from "@/modules/colors";
import { keyColor } from "@/modules/colors";
import { stripAnsi } from "@/utils/ansi";
import { formatRelativeTime } from "@/utils/time";
import { getType, isSimpleValue } from "@/utils/value-helpers";

const MAX_COMPACT_ARRAY_LENGTH = 5;
const MAX_COMPACT_STRING_LENGTH = 30;
const MAX_COMPACT_OBJECT_KEYS = 4;
const VALID_IDENTIFIER_REGEX = /^[$A-Z_a-z][\w$]*$/;
const TREE_COLORS = [colors.dim, colors.gray, colors.dim, colors.gray] as const;

export const formatPrimitive = (value: unknown) => {
  const type = getType(value);

  switch (type) {
    case "string": {
      const raw = String(value);
      // turn new lines into \n
      const escaped = raw.replace(/\r\n/g, "\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n");
      return colors.green(`"${escaped}"`);
    }
    case "number": {
      return colors.yellow(String(value));
    }
    case "boolean": {
      return colors.magenta(String(value));
    }
    case "null": {
      return colors.gray("null");
    }
    case "undefined": {
      return colors.gray("undefined");
    }
    case "symbol": {
      return colors.magenta(String(value));
    }
    case "bigint": {
      return colors.yellow(`${value}n`);
    }
    case "function": {
      if (typeof value === "function") {
        return colors.blueBright(`[Function: ${value.name || "anonymous"}]`);
      }
      return String(value);
    }
    case "date": {
      if (value instanceof Date) {
        const relativeText = colors.dim(`(${formatRelativeTime(value)})`);
        return `${colors.cyan(value.toISOString())} ${relativeText}`;
      }
      return String(value);
    }
    case "regexp": {
      if (value instanceof RegExp) {
        return colors.magenta(value.toString());
      }
      return String(value);
    }
    case "error": {
      if (value instanceof Error) {
        return colors.red(`[Error: ${value.message}]`);
      }
      return String(value);
    }
    default: {
      return String(value);
    }
  }
};

export const formatCompactArray = (arr: unknown[]) => {
  return `[${arr.map(formatPrimitive).join(", ")}]`;
};

export const formatCompactObject = (obj: object) => {
  const entries = Object.entries(obj)
    .map(([key, val]) => {
      const formattedKey = VALID_IDENTIFIER_REGEX.test(key) ? key : `"${key}"`;
      return `${keyColor(formattedKey)}: ${formatPrimitive(val)}`;
    })
    .join(", ");
  return `{ ${entries} }`;
};

export const canBeCompacted = (value: unknown, seen: WeakSet<object>, availableWidth?: number) => {
  if (isSimpleValue(value)) return true;

  // array
  if (Array.isArray(value)) {
    if (value.length > MAX_COMPACT_ARRAY_LENGTH) return false;

    const allValuesAreSimple = value.every((item) => {
      if (!isSimpleValue(item)) return false;
      if (typeof item === "string" && item.length > MAX_COMPACT_STRING_LENGTH) return false;
      return true;
    });
    if (!allValuesAreSimple) return false;

    if (availableWidth !== undefined) {
      const formatted = formatCompactArray(value);
      if (stripAnsi(formatted).length > availableWidth) return false;
    }
    return true;
  }

  // object
  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) return false;

    const keys = Object.keys(value);
    if (keys.length > MAX_COMPACT_OBJECT_KEYS) return false;

    const allValuesAreSimple = keys.every((key) => {
      const val = (value as Record<string, unknown>)[key];
      if (!isSimpleValue(val)) return false;
      if (typeof val === "string" && val.length > MAX_COMPACT_STRING_LENGTH) return false;
      return true;
    });
    if (!allValuesAreSimple) return false;

    if (availableWidth !== undefined) {
      const formatted = formatCompactObject(value);
      if (stripAnsi(formatted).length > availableWidth) return false;
    }
    return true;
  }

  return false;
};

export const getTreeColor = (depth: number) => {
  return TREE_COLORS[depth % TREE_COLORS.length] ?? colors.gray;
};
