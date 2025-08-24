import { getEffectiveWidth } from "@/modules/context";
import { applyTextWrapping } from "@/utils/string";
import { isSimpleValue } from "@/utils/value-helpers";
import { canBeCompacted, formatCompactArray, formatCompactObject, formatPrimitive } from "./formatters";
import { formatWithTree } from "./tree";
import { FormatContext } from "./types";

const DEFAULT_MAX_DEPTH = Number.POSITIVE_INFINITY;

export interface PrettyPrintOptions {
  maxDepth?: number;
  compact?: boolean;
  color?: boolean;
}

export const prettyPrint = (value: unknown, options: PrettyPrintOptions = {}) => {
  const ctx: FormatContext = {
    depth: 0,
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    seen: new WeakSet(),
    compact: options.compact ?? true,
    terminalWidth: getEffectiveWidth(),
    path: [],
  };

  // simple
  if (isSimpleValue(value)) {
    const wrapped = applyTextWrapping(formatPrimitive(value), ctx.terminalWidth, "");
    for (const line of wrapped) console.log(line);
    return;
  }

  // compact
  if (ctx.compact && canBeCompacted(value, ctx.seen)) {
    if (Array.isArray(value)) {
      const wrapped = applyTextWrapping(formatCompactArray(value), ctx.terminalWidth, "");
      for (const line of wrapped) console.log(line);
      return;
    }
    if (typeof value === "object" && value !== null) {
      const wrapped = applyTextWrapping(formatCompactObject(value), ctx.terminalWidth, "");
      for (const line of wrapped) console.log(line);
      return;
    }
  }

  // tree
  const lines = formatWithTree(value, ctx, "");
  for (const line of lines) console.log(line);
};
