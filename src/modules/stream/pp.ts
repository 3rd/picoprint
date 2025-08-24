import type { PrettyPrintOptions } from "@/modules/pp/pp";
import type { FormatContext } from "@/modules/pp/types";
import { getCurrentContext, type RenderContext } from "@/modules/context";
import {
  canBeCompacted,
  formatCompactArray,
  formatCompactObject,
  formatPrimitive,
} from "@/modules/pp/formatters";
import { formatWithTree } from "@/modules/pp/tree";
import { applyTextWrapping } from "@/utils/string";
import { isSimpleValue } from "@/utils/value-helpers";
import type { Closable } from "./_shared";

export interface PPStreamOptions extends PrettyPrintOptions {
  context?: RenderContext;
}
export interface PPStream extends Closable {
  value: (v: unknown) => void;
  text: (s: string) => void;
}

export const pp = (opts: PPStreamOptions = {}): PPStream => {
  const ctx = opts.context ?? getCurrentContext();
  const indentBase = " ".repeat(ctx.offset);

  const printValue = (value: unknown) => {
    const width = ctx.getWidth();
    const fctx: FormatContext = {
      depth: 0,
      maxDepth: opts.maxDepth ?? Number.POSITIVE_INFINITY,
      seen: new WeakSet(),
      compact: opts.compact ?? true,
      terminalWidth: width,
      path: [],
    };

    if (isSimpleValue(value)) {
      const wrapped = applyTextWrapping(formatPrimitive(value), width, "");
      for (const line of wrapped) console.log(indentBase + line);
      return;
    }

    if (fctx.compact && canBeCompacted(value, fctx.seen)) {
      const compactStr =
        Array.isArray(value) ? formatCompactArray(value) : formatCompactObject(value as object);
      for (const line of applyTextWrapping(compactStr, width, "")) console.log(indentBase + line);
      return;
    }

    const lines = formatWithTree(value, fctx, "");
    for (const line of lines) console.log(indentBase + line);
  };

  return {
    value: printValue,
    text: (s: string) => {
      const width = ctx.getWidth();
      for (const line of applyTextWrapping(s, width, "")) console.log(indentBase + line);
    },
    close: () => {
      /* no-op */
    },
  };
};
