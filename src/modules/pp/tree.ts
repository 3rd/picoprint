import * as colors from "@/modules/colors";
import { keyColor } from "@/modules/colors";
import { stripAnsi } from "@/utils/ansi";
import { applyTextWrapping } from "@/utils/string";
import { isSimpleValue } from "@/utils/value-helpers";
import {
  canBeCompacted,
  formatCompactArray,
  formatCompactObject,
  formatPrimitive,
  getTreeColor,
} from "./formatters";
import { FormatContext } from "./types";

const TREE_MARGIN = 2;
const MAX_INLINE_ARRAY_LENGTH = 5;
const MAX_INLINE_OBJECT_KEYS = 3;
const KEY_SPACING = 4;
const KEY_PADDING = 2;
const VALID_IDENTIFIER_REGEX = /^[$A-Z_a-z][\w$]*$/;

const shouldBeCompactInline = (value: unknown, ctx: FormatContext) => {
  if (!ctx.compact) return false;
  if (isSimpleValue(value)) return true;

  if (Array.isArray(value)) {
    if (value.length > MAX_INLINE_ARRAY_LENGTH) return false;
    return value.every(isSimpleValue);
  }

  if (typeof value === "object" && value !== null) {
    if (ctx.seen.has(value)) return false;
    const keys = Object.keys(value);
    if (keys.length > MAX_INLINE_OBJECT_KEYS) return false;
    return keys.every((key) => isSimpleValue((value as Record<string, unknown>)[key]));
  }

  return false;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export const formatWithTree = (value: unknown, ctx: FormatContext, parentPrefix = "") => {
  if (ctx.depth > ctx.maxDepth) {
    return [`${parentPrefix}${colors.gray("...")}`];
  }

  if (isSimpleValue(value)) {
    return [formatPrimitive(value)];
  }

  if (typeof value === "object" && value !== null) {
    if (ctx.seen.has(value)) {
      return [colors.red("[Circular]")];
    }
    ctx.seen.add(value);
  }

  if (ctx.compact && canBeCompacted(value, ctx.seen)) {
    if (Array.isArray(value)) {
      return [formatCompactArray(value)];
    }
    if (typeof value === "object" && value !== null) {
      return [formatCompactObject(value)];
    }
  }

  const lines: string[] = [];

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [colors.gray("[]")];
    }

    const allItemsCompact = value.every((item) => shouldBeCompactInline(item, ctx));

    const treeColor = getTreeColor(ctx.depth);
    for (const [index, item] of value.entries()) {
      const isLastItem = index === value.length - 1;
      const itemPrefix = treeColor(isLastItem ? "└─" : "├─");
      const continuationPrefix = treeColor(isLastItem ? "  " : "│ ");
      const key = keyColor(`[${index}]`);

      const newCtx = {
        ...ctx,
        depth: ctx.depth + 1,
        path: [...ctx.path, `[${index}]`],
      } satisfies FormatContext;

      if (isSimpleValue(item)) {
        const prefix = `${parentPrefix}${itemPrefix} ${key}: `;
        const availableWidth = ctx.terminalWidth - stripAnsi(prefix).length - TREE_MARGIN;
        const wrapIndent =
          parentPrefix + continuationPrefix + " ".repeat(stripAnsi(key).length + KEY_SPACING);
        const wrappedLines = applyTextWrapping(formatPrimitive(item), availableWidth, wrapIndent);

        lines.push(`${prefix}${wrappedLines[0] || ""}`);
        for (let i = 1; i < wrappedLines.length; i++) {
          const line = wrappedLines[i];
          if (line !== undefined) lines.push(line);
        }
      } else if (allItemsCompact) {
        const formatted = Array.isArray(item) ? formatCompactArray(item) : formatCompactObject(item);
        const prefix = `${parentPrefix}${itemPrefix} ${key}: `;
        const availableWidth = ctx.terminalWidth - stripAnsi(prefix).length - TREE_MARGIN;
        const wrapIndent =
          parentPrefix + continuationPrefix + " ".repeat(stripAnsi(key).length + KEY_SPACING);
        const wrappedLines = applyTextWrapping(formatted, availableWidth, wrapIndent);

        lines.push(`${prefix}${wrappedLines[0] || ""}`);
        for (let i = 1; i < wrappedLines.length; i++) {
          const line = wrappedLines[i];
          if (line !== undefined) lines.push(line);
        }
      } else {
        lines.push(`${parentPrefix}${itemPrefix} ${key}`);
        const subLines = formatWithTree(item, newCtx, parentPrefix + continuationPrefix);
        for (const line of subLines) lines.push(line);
      }
    }
  } else if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return [colors.gray("{}")];
    }

    const treeColor = getTreeColor(ctx.depth);
    for (const [index, [key, val]] of entries.entries()) {
      const isLastItem = index === entries.length - 1;
      const itemPrefix = treeColor(isLastItem ? "└─" : "├─");
      const continuationPrefix = treeColor(isLastItem ? "  " : "│ ");
      const formattedKey = VALID_IDENTIFIER_REGEX.test(key) ? key : `"${key}"`;

      const newCtx = {
        ...ctx,
        depth: ctx.depth + 1,
        path: [...ctx.path, key],
      } satisfies FormatContext;

      if (isSimpleValue(val)) {
        const prefix = `${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}: `;
        const availableWidth = ctx.terminalWidth - stripAnsi(prefix).length - TREE_MARGIN;
        const wrapIndent =
          parentPrefix + continuationPrefix + " ".repeat(stripAnsi(formattedKey).length + KEY_PADDING);
        const wrappedLines = applyTextWrapping(formatPrimitive(val), availableWidth, wrapIndent);

        lines.push(`${prefix}${wrappedLines[0] || ""}`);
        for (let i = 1; i < wrappedLines.length; i++) {
          const line = wrappedLines[i];
          if (line !== undefined) lines.push(line);
        }
      } else if (ctx.compact) {
        const prefix = `${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}: `;
        const availableWidth = ctx.terminalWidth - stripAnsi(prefix).length - TREE_MARGIN;

        if (canBeCompacted(val, ctx.seen, availableWidth)) {
          const formatted = Array.isArray(val) ? formatCompactArray(val) : formatCompactObject(val);

          const wrapIndent =
            parentPrefix + continuationPrefix + " ".repeat(stripAnsi(formattedKey).length + 2);
          const wrappedLines = applyTextWrapping(formatted, availableWidth, wrapIndent);

          lines.push(`${prefix}${wrappedLines[0]}`);
          for (let i = 1; i < wrappedLines.length; i++) {
            const line = wrappedLines[i];
            if (line !== undefined) lines.push(line);
          }
        } else {
          lines.push(`${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}`);
          const subLines = formatWithTree(val, newCtx, parentPrefix + continuationPrefix);
          for (const line of subLines) lines.push(line);
        }
      } else {
        lines.push(`${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}`);
        const subLines = formatWithTree(val, newCtx, parentPrefix + continuationPrefix);
        for (const line of subLines) lines.push(line);
      }
    }
  } else {
    return [formatPrimitive(value)];
  }

  return lines;
};
