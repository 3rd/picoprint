import { colors, keyColor } from "@/modules/colors";
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
import { TREE_MARGIN, visibleLen } from "./_shared";

export interface TreeStreamOptions {
  bullet?: string; // default "•"
  indent?: string; // default "│ "
  nodeColor?: (s: string) => string; // default colors.cyan
  valueColor?: (s: string) => string; // default colors.yellow
  connectorColor?: (s: string) => string; // default colors.dim
  context?: RenderContext;
}
export interface TreeStream extends Closable {
  node: (text: string) => void; // print a node at current depth
  enter: (text?: string) => void; // optionally print, then increase depth
  leave: (count?: number) => void; // decrease depth
  kv: (key: string, value: unknown) => void; // key/value helper (compact when possible)
}

export const tree = (options: TreeStreamOptions = {}): TreeStream => {
  const ctx = options.context ?? getCurrentContext();
  const indentBase = " ".repeat(ctx.offset);
  const bullet = options.bullet ?? "•";
  const indentUnit = options.indent ?? "│ ";
  const nodeColor = options.nodeColor ?? colors.cyan;
  const valueColor = options.valueColor ?? colors.yellow;
  const connectorColor = options.connectorColor ?? colors.dim;

  let depth = 0;

  const prefix = () => connectorColor(indentUnit.repeat(depth));

  const printlnWrapped = (head: string, contentColored: string) => {
    const width = ctx.getWidth();
    const p = prefix();
    const headColored = connectorColor(head);
    const avail = Math.max(1, width - visibleLen(p + headColored) - TREE_MARGIN);
    const wrapIndent = p + " ".repeat(visibleLen(head));
    const wrapped = applyTextWrapping(contentColored, avail, wrapIndent);
    console.log(indentBase + p + headColored + (wrapped[0] ?? ""));
    for (let i = 1; i < wrapped.length; i++) console.log(indentBase + wrapped[i]!);
  };

  return {
    node: (text: string) => {
      printlnWrapped(`${bullet} `, nodeColor(text));
    },
    enter: (text?: string) => {
      if (text) printlnWrapped(`${bullet} `, nodeColor(text));
      depth = Math.max(0, depth + 1);
    },
    leave: (count = 1) => {
      depth = Math.max(0, depth - count);
    },
    kv: (key: string, value: unknown) => {
      const width = ctx.getWidth();
      const keyStr = keyColor(key);
      const seen = new WeakSet<object>();

      if (isSimpleValue(value)) {
        printlnWrapped(`${bullet} `, `${keyStr}: ${formatPrimitive(value)}`);
        return;
      }

      if (Array.isArray(value)) {
        if (canBeCompacted(value, seen)) {
          printlnWrapped(`${bullet} `, `${keyStr}: ${formatCompactArray(value)}`);
        } else {
          const valueText = colors.cyan(`[Array(${value.length})]`);
          printlnWrapped(`${bullet} `, `${keyStr}: ${valueText}`);
        }
        return;
      }

      if (typeof value === "object" && value !== null) {
        if (canBeCompacted(value, seen)) {
          printlnWrapped(`${bullet} `, `${keyStr}: ${formatCompactObject(value as object)}`);
        } else {
          printlnWrapped(`${bullet} `, `${keyStr}: ${colors.cyan("[Object]")}`);
        }
        return;
      }

      // fallback
      const fctx: import("@/modules/pp/types").FormatContext = {
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
        console.log(`${indentBase + prefix()}  ${lines[i]}`);
      }
    },
    close: () => {
      /* no-op */
    },
  };
};
