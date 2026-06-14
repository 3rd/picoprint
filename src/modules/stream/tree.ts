import type { FormatContext } from "../pp/types";
import type { Closable } from "./_shared";
import { stringWidth } from "../../utils/ansi";
import { assertColorFunctionOption, colors, keyColor } from "../../utils/colors";
import {
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringArgument,
  assertStringOption,
} from "../../utils/options";
import { applyTextWrapping } from "../../utils/string";
import { isSimpleValue } from "../../utils/value-helpers";
import { write } from "../../utils/writer";
import { type RenderOptions, resolveRenderContext } from "../context";
import { canBeCompacted, formatCompactValue, formatPrimitive } from "../pp/formatters";
import { formatWithTree } from "../pp/tree";
import { TREE_MARGIN } from "./_shared";

export interface TreeStreamOptions {
  offset?: RenderOptions["offset"];
  bullet?: string; // default "•"
  indent?: string; // default "│ "
  colors?: {
    node?: (s: string) => string;
    value?: (s: string) => string;
    connector?: (s: string) => string;
  };
  nodeColor?: (s: string) => string; // default colors.cyan
  valueColor?: (s: string) => string; // default colors.yellow
  connectorColor?: (s: string) => string; // default colors.dim
  renderContext?: RenderOptions["renderContext"];
}
export interface TreeStream extends Closable {
  node: (text: string) => void; // print a node at current depth
  enter: (text?: string) => void; // optionally print, then increase depth
  leave: (count?: number) => void; // decrease depth
  kv: (key: string, value: unknown) => void; // key/value helper (compact when possible)
}

const validateTreeStreamOptions = (options: TreeStreamOptions) => {
  assertPlainOptionsObject(options, "stream.tree options");
  assertStringOption(options.bullet, "bullet");
  assertStringOption(options.indent, "indent");
  assertPlainOptionsObject(options.colors, "stream.tree colors");
  assertColorFunctionOption(options.colors?.node, "stream.tree colors.node");
  assertColorFunctionOption(options.colors?.value, "stream.tree colors.value");
  assertColorFunctionOption(options.colors?.connector, "stream.tree colors.connector");
  assertColorFunctionOption(options.nodeColor, "nodeColor");
  assertColorFunctionOption(options.valueColor, "valueColor");
  assertColorFunctionOption(options.connectorColor, "connectorColor");
};

export const tree = (options: TreeStreamOptions = {}): TreeStream => {
  validateTreeStreamOptions(options);
  const ctx = resolveRenderContext(options);
  const indentBase = " ".repeat(ctx.offset);
  const bullet = options.bullet ?? "•";
  const indentUnit = options.indent ?? "│ ";
  const nodeColor = options.colors?.node ?? options.nodeColor ?? colors.cyan;
  const valueColor = options.colors?.value ?? options.valueColor ?? colors.yellow;
  const connectorColor = options.colors?.connector ?? options.connectorColor ?? colors.dim;

  let depth = 0;
  let isOpen = true;

  const prefix = () => connectorColor(indentUnit.repeat(depth));

  const printlnWrapped = (head: string, contentColored: string) => {
    const width = ctx.getWidth();
    const p = prefix();
    const headColored = connectorColor(head);
    const avail = Math.max(1, width - stringWidth(p + headColored) - TREE_MARGIN);
    const wrapIndent = p + " ".repeat(stringWidth(head));
    const wrapped = applyTextWrapping(contentColored, avail, wrapIndent);
    write(indentBase + p + headColored + (wrapped[0] ?? ""));
    for (let i = 1; i < wrapped.length; i++) write(indentBase + wrapped[i]!);
  };

  return {
    node: (text: string) => {
      if (!isOpen) return;
      assertStringArgument(text, "stream.tree node text");
      printlnWrapped(`${bullet} `, nodeColor(text));
    },
    enter: (text?: string) => {
      if (!isOpen) return;
      if (text !== undefined) {
        assertStringArgument(text, "stream.tree enter text");
        printlnWrapped(`${bullet} `, nodeColor(text));
      }
      depth = Math.max(0, depth + 1);
    },
    leave: (count = 1) => {
      if (!isOpen) return;
      assertNonNegativeIntegerOption(count, "stream.tree leave count");
      depth = Math.max(0, depth - count);
    },
    kv: (key: string, value: unknown) => {
      if (!isOpen) return;
      assertStringArgument(key, "stream.tree kv key");
      const width = ctx.getWidth();
      const keyStr = keyColor(key);
      const seen = new WeakSet<object>();

      if (isSimpleValue(value)) {
        printlnWrapped(`${bullet} `, `${keyStr}: ${formatPrimitive(value)}`);
        return;
      }

      if (Array.isArray(value)) {
        if (canBeCompacted(value, seen)) {
          printlnWrapped(`${bullet} `, `${keyStr}: ${formatCompactValue(value)}`);
        } else {
          const valueText = colors.cyan(`[Array(${value.length})]`);
          printlnWrapped(`${bullet} `, `${keyStr}: ${valueText}`);
        }
        return;
      }

      if (typeof value === "object" && value !== null) {
        if (canBeCompacted(value, seen)) {
          printlnWrapped(`${bullet} `, `${keyStr}: ${formatCompactValue(value)}`);
        } else {
          printlnWrapped(`${bullet} `, `${keyStr}: ${colors.cyan("[Object]")}`);
        }
        return;
      }

      const fctx: FormatContext = {
        depth: 0,
        maxDepth: Number.POSITIVE_INFINITY,
        seen: new WeakSet(),
        compact: true,
        terminalWidth: width,
        path: [],
      };
      const lines = formatWithTree(value, fctx, "");
      printlnWrapped(`${bullet} `, `${keyStr}: ${valueColor(String(lines[0] ?? ""))}`);
      for (let i = 1; i < lines.length; i++) {
        write(`${indentBase + prefix()}  ${lines[i]}`);
      }
    },
    close: () => {
      isOpen = false;
    },
  };
};
