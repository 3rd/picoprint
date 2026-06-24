import { stringWidth } from "../../utils/ansi";
import { keyColor } from "../../utils/colors";
import { applyTextWrapping } from "../../utils/string";
import { isSimpleValue } from "../../utils/value-helpers";
import * as colors from "../colors";
import {
  canBeCompacted,
  formatCompactValue,
  formatPrimitive,
  getTreeColor,
  toEntries,
  toItems,
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

  const items = toItems(value);
  if (items) {
    if (items.length > MAX_INLINE_ARRAY_LENGTH) return false;
    return items.every(isSimpleValue);
  }

  if (typeof value === "object" && value !== null) {
    if (ctx.seen.has(value)) return false;
    const entries = toEntries(value);
    if (entries.length > MAX_INLINE_OBJECT_KEYS) return false;
    return entries.every(([, val]) => isSimpleValue(val));
  }

  return false;
};

const pushWrapped = (lines: string[], prefix: string, wrapped: string[]) => {
  lines.push(`${prefix}${wrapped[0] || ""}`);
  for (let i = 1; i < wrapped.length; i++) {
    const line = wrapped[i];
    if (line !== undefined) lines.push(line);
  }
};

// eslint-disable-next-line sonarjs/cognitive-complexity -- heavy renderer, suppression per repo convention
export const formatWithTree = (value: unknown, ctx: FormatContext, parentPrefix = ""): string[] => {
  if (ctx.depth > ctx.maxDepth) {
    return [`${parentPrefix}${colors.gray("...")}`];
  }

  if (isSimpleValue(value)) {
    return [`${parentPrefix}${formatPrimitive(value)}`];
  }

  let trackedObject: object | undefined;
  if (typeof value === "object" && value !== null) {
    if (ctx.seen.has(value)) {
      return [`${parentPrefix}${colors.red("[Circular]")}`];
    }
    ctx.seen.add(value);
    trackedObject = value;
  }

  try {
    if (typeof value === "object" && value !== null && ctx.compact && canBeCompacted(value, ctx.seen)) {
      return [`${parentPrefix}${formatCompactValue(value)}`];
    }

    const lines: string[] = [];
    const items = toItems(value);

    if (items) {
      if (items.length === 0) {
        return [`${parentPrefix}${colors.gray(Array.isArray(value) ? "[]" : "Set(0)")}`];
      }

      const allItemsCompact = items.every((item) => shouldBeCompactInline(item, ctx));

      const treeColor = getTreeColor(ctx.depth);
      for (const [index, item] of items.entries()) {
        const isLastItem = index === items.length - 1;
        const itemPrefix = treeColor(isLastItem ? "└─" : "├─");
        const continuationPrefix = treeColor(isLastItem ? "  " : "│ ");
        const key = keyColor(`[${index}]`);

        const newCtx = {
          ...ctx,
          depth: ctx.depth + 1,
          path: [...ctx.path, `[${index}]`],
        } satisfies FormatContext;

        if (isSimpleValue(item) || allItemsCompact) {
          const formatted = isSimpleValue(item) ? formatPrimitive(item) : formatCompactValue(item as object);
          const prefix = `${parentPrefix}${itemPrefix} ${key}: `;
          const availableWidth = ctx.terminalWidth - stringWidth(prefix) - TREE_MARGIN;
          const wrapIndent = parentPrefix + continuationPrefix + " ".repeat(stringWidth(key) + KEY_SPACING);
          pushWrapped(lines, prefix, applyTextWrapping(formatted, availableWidth, wrapIndent));
        } else {
          lines.push(`${parentPrefix}${itemPrefix} ${key}`);
          lines.push(...formatWithTree(item, newCtx, parentPrefix + continuationPrefix));
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const entries = toEntries(value);

      if (entries.length === 0) {
        return [`${parentPrefix}${colors.gray(value instanceof Map ? "Map(0)" : "{}")}`];
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
          const availableWidth = ctx.terminalWidth - stringWidth(prefix) - TREE_MARGIN;
          const wrapIndent =
            parentPrefix + continuationPrefix + " ".repeat(stringWidth(formattedKey) + KEY_PADDING);
          pushWrapped(lines, prefix, applyTextWrapping(formatPrimitive(val), availableWidth, wrapIndent));
        } else if (ctx.compact) {
          const prefix = `${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}: `;
          const availableWidth = ctx.terminalWidth - stringWidth(prefix) - TREE_MARGIN;

          if (canBeCompacted(val, ctx.seen, availableWidth)) {
            const wrapIndent =
              parentPrefix + continuationPrefix + " ".repeat(stringWidth(formattedKey) + KEY_PADDING);
            pushWrapped(
              lines,
              prefix,
              applyTextWrapping(formatCompactValue(val as object), availableWidth, wrapIndent),
            );
          } else {
            lines.push(`${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}`);
            lines.push(...formatWithTree(val, newCtx, parentPrefix + continuationPrefix));
          }
        } else {
          lines.push(`${parentPrefix}${itemPrefix} ${keyColor(formattedKey)}`);
          lines.push(...formatWithTree(val, newCtx, parentPrefix + continuationPrefix));
        }
      }
    } else {
      return [`${parentPrefix}${formatPrimitive(value)}`];
    }

    return lines;
  } finally {
    if (trackedObject) ctx.seen.delete(trackedObject);
  }
};
