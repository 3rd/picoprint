import { colors, keyColor, typeColor } from "@/modules/colors";
import { getType, isArray, isObject } from "@/utils/value-helpers";
const VALID_IDENTIFIER_REGEX = /^[$A-Z_a-z][\w$]*$/;

const safeStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "bigint") return `${val}n`;
        if (val instanceof Date) return val.toISOString();
        if (val instanceof RegExp) return String(val);
        if (val instanceof Error) return `Error: ${val.message}`;
        if (val instanceof Map) return Object.fromEntries(Array.from(val.entries()));
        if (val instanceof Set) return Array.from(val.values());
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      },
      2,
    );
  } catch {
    // as a last resort
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  }
};

export const toInlineLogString = (value: unknown): string => {
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

const formatColored = (value: unknown, seen: WeakSet<object>, indent = 0, inline = false): string[] => {
  const sp = " ".repeat(indent);
  const t = getType(value);

  // simple types
  if (t === "string") return [sp + colors.green(inline ? String(value) : JSON.stringify(String(value)))];
  if (t === "number") return [sp + colors.yellow(String(value))];
  if (t === "bigint") return [sp + colors.yellow(`${value as bigint}n`)];
  if (t === "boolean") return [sp + colors.magenta(String(value))];
  if (t === "null") return [sp + colors.gray("null")];
  if (t === "undefined") return [sp + colors.gray("undefined")];
  if (t === "symbol") return [sp + colors.magenta(String(value))];
  if (t === "function") {
    const fn = value as Function;
    return [sp + colors.blueBright(`[Function: ${fn.name || "anonymous"}]`)];
  }
  if (t === "date") {
    const iso = (value as Date).toISOString();
    return [sp + colors.cyan(inline ? iso : JSON.stringify(iso))];
  }
  if (t === "regexp") return [sp + colors.magenta(String(value))];
  if (t === "error") return [sp + colors.red(`[Error: ${(value as Error).message}]`)];

  // prevent circular
  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) return [sp + colors.red("[Circular]")];
    seen.add(value);
  }

  // array
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

  // object
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
        // inline
        const valStr = valLines[0]?.slice(indent + 2);
        lines.push(`${sp}  ${keyStr}: ${valStr}${i < keys.length - 1 ? "," : ""}`);
      } else {
        // multi-line value
        lines.push(`${sp}  ${keyStr}: ${valLines[0]?.slice(indent + 2)}`);
        for (let j = 1; j < valLines.length; j++) lines.push(valLines[j]!);
        if (i < keys.length - 1) lines[lines.length - 1] = `${lines[lines.length - 1] || ""},`;
      }
    }
    lines.push(`${sp}}`);
    return lines;
  }

  // fallback via typeColor
  const c = typeColor(t);
  return [sp + c(String(value))];
};

export const toColoredLogString = (value: unknown): string => {
  return formatColored(value, new WeakSet<object>(), 0, false).join("\n");
};

export const toColoredInlineString = (value: unknown): string => {
  return formatColored(value, new WeakSet<object>(), 0, true).join("\n");
};
