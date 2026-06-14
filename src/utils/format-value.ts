// value -> display-string formatting shared by log, table, diff, and stream rendering.
// uses ./colors (not ../modules/colors) to avoid a cycle: ../modules/colors -> format-value
import { colors, getTypeColor } from "./colors";
import { getType, isArray, isObject } from "./value-helpers";

const keyColor = colors.white;
const VALID_IDENTIFIER_REGEX = /^[$A-Z_a-z][\w$]*$/;

export interface FormatValueOptions {
  quoteStrings?: boolean;
}

// single-line colored rendering for table cells and diff values
export const formatValueColored = (value: unknown, options?: FormatValueOptions) => {
  if (value === null) return getTypeColor("null")("null");
  if (value === undefined) return getTypeColor("undefined")("undefined");
  if (typeof value === "boolean") return getTypeColor("boolean")(String(value));
  if (typeof value === "number") return getTypeColor("number")(String(value));
  if (typeof value === "bigint") return getTypeColor("bigint")(`${value}n`);
  if (value instanceof Date) return getTypeColor("date")(value.toISOString());
  if (typeof value === "string") {
    const c = getTypeColor("string");
    return options?.quoteStrings ? c(`"${value}"`) : c(value);
  }
  if (Array.isArray(value)) return getTypeColor("array")(`[Array(${value.length})]`);
  if (typeof value === "object") return getTypeColor("object")("[Object]");
  return String(value);
};

const normalizeForStringify = (value: unknown, stack: Set<object>): unknown => {
  if (typeof value === "bigint") return `${value}n`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (value instanceof Error) return `Error: ${value.message}`;
  if (typeof value !== "object" || value === null) return value;

  if (stack.has(value)) return "[Circular]";
  stack.add(value);
  try {
    if (value instanceof Map) {
      return Object.fromEntries(
        Array.from(value.entries(), ([key, entryValue]) => [key, normalizeForStringify(entryValue, stack)]),
      );
    }
    if (value instanceof Set) {
      return Array.from(value.values(), (entryValue) => normalizeForStringify(entryValue, stack));
    }
    if (Array.isArray(value)) return value.map((entryValue) => normalizeForStringify(entryValue, stack));

    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      normalized[key] = normalizeForStringify((value as Record<string, unknown>)[key], stack);
    }
    return normalized;
  } finally {
    stack.delete(value);
  }
};

export const safeStringify = (value: unknown) => {
  try {
    const result = JSON.stringify(normalizeForStringify(value, new Set<object>()), undefined, 2);
    return result ?? String(value);
  } catch {
    // last resort for values whose toString itself throws
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  }
};

export const toInlineLogString = (value: unknown) => {
  const type = getType(value);
  switch (type) {
    case "string":
    case "number":
    case "boolean":
    case "null":
    case "undefined":
    case "symbol": {
      return String(value);
    }
    case "bigint": {
      return `${value as bigint}n`;
    }
    case "function": {
      const fn = value as Function;
      return `[Function: ${fn.name || "anonymous"}]`;
    }
    case "date": {
      return (value as Date).toISOString();
    }
    case "regexp": {
      return String(value);
    }
    case "error": {
      const err = value as Error;
      return `[Error: ${err.message}]`;
    }
    default: {
      return safeStringify(value);
    }
  }
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const formatColored = (value: unknown, seen: WeakSet<object>, indent = 0, inline = false): string[] => {
  const sp = " ".repeat(indent);
  const t = getType(value);

  if (t === "string") return [sp + (inline ? String(value) : getTypeColor(t)(JSON.stringify(String(value))))];
  if (t === "bigint") return [sp + getTypeColor(t)(`${value as bigint}n`)];
  if (t === "function") {
    const fn = value as Function;
    return [sp + getTypeColor(t)(`[Function: ${fn.name || "anonymous"}]`)];
  }
  if (t === "date") {
    const iso = (value as Date).toISOString();
    return [sp + getTypeColor(t)(inline ? iso : JSON.stringify(iso))];
  }
  if (t === "error") return [sp + getTypeColor(t)(`[Error: ${(value as Error).message}]`)];
  if (
    t === "number" ||
    t === "boolean" ||
    t === "null" ||
    t === "undefined" ||
    t === "symbol" ||
    t === "regexp"
  ) {
    return [sp + getTypeColor(t)(String(value))];
  }

  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) return [sp + colors.red("[Circular]")];
    seen.add(value);
  }

  if (isArray(value)) {
    const arr = value as unknown[];
    if (arr.length === 0) return [`${sp}[]`];
    const lines: string[] = [];
    lines.push(`${sp}[`);
    for (let i = 0; i < arr.length; i++) {
      const part = formatColored(arr[i], seen, indent + 2, false);
      if (part.length === 1) lines.push(part[0] + (i < arr.length - 1 ? "," : ""));
      else {
        for (let j = 0; j < part.length; j++) {
          const line = part[j] ?? "";
          lines.push(line + (j === part.length - 1 && i < arr.length - 1 ? "," : ""));
        }
      }
    }
    lines.push(`${sp}]`);
    return lines;
  }

  if (isObject(value)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return [`${sp}{}`];
    const lines: string[] = [];
    lines.push(`${sp}{`);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]!;
      const v = obj[k];
      const keyText = VALID_IDENTIFIER_REGEX.test(k) ? k : JSON.stringify(k);
      const keyStr = keyColor(keyText);
      const valLines = formatColored(v, seen, indent + 2, false);
      if (valLines.length === 1) {
        const valStr = valLines[0]?.slice(indent + 2);
        lines.push(`${sp}  ${keyStr}: ${valStr}${i < keys.length - 1 ? "," : ""}`);
      } else {
        lines.push(`${sp}  ${keyStr}: ${valLines[0]?.slice(indent + 2)}`);
        for (let j = 1; j < valLines.length; j++) lines.push(valLines[j]!);
        if (i < keys.length - 1) lines[lines.length - 1] = `${lines[lines.length - 1] || ""},`;
      }
    }
    lines.push(`${sp}}`);
    return lines;
  }

  return [sp + getTypeColor(t)(String(value))];
};

export const toColoredInlineString = (value: unknown) => {
  return formatColored(value, new WeakSet<object>(), 0, true).join("\n");
};
