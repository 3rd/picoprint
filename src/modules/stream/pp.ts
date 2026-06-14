import type { FormatContext } from "../pp/types";
import type { Closable } from "./_shared";
import { assertPlainOptionsObject, assertStringArgument } from "../../utils/options";
import { applyTextWrapping } from "../../utils/string";
import { isSimpleValue } from "../../utils/value-helpers";
import { write } from "../../utils/writer";
import { resolveRenderContext } from "../context";
import { canBeCompacted, formatCompactValue, formatPrimitive } from "../pp/formatters";
import { type PrettyPrintOptions, validatePrettyPrintOptions } from "../pp/pp";
import { formatWithTree } from "../pp/tree";

export interface PPStreamOptions extends PrettyPrintOptions {}
export interface PPStream extends Closable {
  value: (v: unknown) => void;
  text: (s: string) => void;
}

export const pp = (opts: PPStreamOptions = {}): PPStream => {
  assertPlainOptionsObject(opts as unknown, "stream.pp options");
  validatePrettyPrintOptions(opts);
  const ctx = resolveRenderContext(opts);
  const indentBase = " ".repeat(ctx.offset);
  let isOpen = true;

  const printValue = (value: unknown) => {
    if (!isOpen) return;
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
      for (const line of wrapped) write(indentBase + line);
      return;
    }

    if (fctx.compact && typeof value === "object" && value !== null && canBeCompacted(value, fctx.seen)) {
      for (const line of applyTextWrapping(formatCompactValue(value), width, "")) write(indentBase + line);
      return;
    }

    const lines = formatWithTree(value, fctx, "");
    for (const line of lines) write(indentBase + line);
  };

  return {
    value: printValue,
    text: (s: string) => {
      if (!isOpen) return;
      assertStringArgument(s, "stream.pp text");
      const width = ctx.getWidth();
      for (const line of applyTextWrapping(s, width, "")) write(indentBase + line);
    },
    close: () => {
      isOpen = false;
    },
  };
};
