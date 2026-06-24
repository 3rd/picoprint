import {
  assertBooleanOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
} from "../../utils/options";
import { applyTextWrapping } from "../../utils/string";
import { isSimpleValue } from "../../utils/value-helpers";
import { renderAndReturn, write } from "../../utils/writer";
import * as colors from "../colors";
import { getConfig } from "../config";
import { type RenderOptions, resolveRenderContext } from "../context";
import { canBeCompacted, formatCompactValue, formatPrimitive } from "./formatters";
import { formatWithTree } from "./tree";
import { FormatContext } from "./types";

const DEFAULT_MAX_DEPTH = Number.POSITIVE_INFINITY;

export interface PrettyPrintOptions {
  offset?: RenderOptions["offset"];
  renderContext?: RenderOptions["renderContext"];
  maxDepth?: number;
  compact?: boolean;
}

export const validatePrettyPrintOptions = (options: PrettyPrintOptions) => {
  assertPlainOptionsObject(options, "pp options");
  assertNonNegativeIntegerOption(options.maxDepth, "maxDepth");
  assertBooleanOption(options.compact, "compact");
};

const printSingleValue = (value: unknown, options: PrettyPrintOptions = {}) => {
  const renderContext = resolveRenderContext(options);
  const indent = " ".repeat(renderContext.offset);
  const ctx: FormatContext = {
    depth: 0,
    maxDepth: options.maxDepth ?? getConfig().defaults?.maxDepth ?? DEFAULT_MAX_DEPTH,
    seen: new WeakSet(),
    compact: options.compact ?? getConfig().defaults?.compact ?? true,
    terminalWidth: renderContext.getWidth(),
    path: [],
  };

  if (isSimpleValue(value)) {
    const wrapped = applyTextWrapping(formatPrimitive(value), ctx.terminalWidth, "");
    for (const line of wrapped) write(indent + line);
    return;
  }

  if (ctx.compact && typeof value === "object" && value !== null && canBeCompacted(value, ctx.seen)) {
    const wrapped = applyTextWrapping(formatCompactValue(value), ctx.terminalWidth, "");
    for (const line of wrapped) write(indent + line);
    return;
  }

  const lines = formatWithTree(value, ctx, "");
  for (const line of lines) write(indent + line);
};

export const prettyPrint = (value: unknown, options: PrettyPrintOptions = {}) => {
  validatePrettyPrintOptions(options);
  return renderAndReturn(() => {
    const renderContext = resolveRenderContext(options);
    const indent = " ".repeat(renderContext.offset);
    if (typeof value === "string") {
      write(indent + colors.blue(value));
      return;
    }
    printSingleValue(value, options);
  });
};
