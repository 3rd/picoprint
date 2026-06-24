import { stringWidth } from "../../utils/ansi";
import { colors, keyColor } from "../../utils/colors";
import { assertLineStyleOption, getLineStyle, type LineStyleName } from "../../utils/line-styles";
import {
  ALIGN_VALUES,
  assertBooleanOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertRecordArgument,
  assertStringRecordEnumOption,
} from "../../utils/options";
import { write } from "../../utils/writer";
import { getConfig } from "../config";
import { type RenderOptions, resolveRenderContext } from "../context";
import { formatTableCell, padCell } from "../table/_shared";
import { Closable } from "./_shared";

export interface TableStreamOptions {
  offset?: RenderOptions["offset"];
  columns: readonly string[];
  maxWidth?: number; // per-column
  align?: Record<string, "center" | "left" | "right">;
  showIndex?: boolean;
  compact?: boolean;
  style?: LineStyleName;
  renderContext?: RenderOptions["renderContext"];
}
export interface TableStream extends Closable {
  row: (data: Record<string, unknown>) => void;
}

const validateTableStreamOptions = (opts: TableStreamOptions) => {
  if (
    !opts ||
    !Array.isArray(opts.columns) ||
    opts.columns.length === 0 ||
    opts.columns.some((column) => typeof column !== "string")
  ) {
    throw new TypeError("picoprint stream.table columns must be a non-empty string[]");
  }
  assertPlainOptionsObject(opts, "stream.table options");
  assertNonNegativeIntegerOption(opts.maxWidth, "maxWidth");
  assertStringRecordEnumOption(opts.align, "align", ALIGN_VALUES);
  assertBooleanOption(opts.showIndex, "showIndex");
  assertBooleanOption(opts.compact, "compact");
  assertLineStyleOption(opts.style, "style");
};

export const table = (opts: TableStreamOptions): TableStream => {
  validateTableStreamOptions(opts);
  const ctx = resolveRenderContext(opts);
  const indent = " ".repeat(ctx.offset);
  const styleName = opts.style ?? getConfig().defaults?.style ?? "single";
  const style = getLineStyle(styleName);
  const compact = opts.compact ?? getConfig().defaults?.compact ?? false;
  const padding = compact ? 1 : 2;
  const maxWidth = opts.maxWidth ?? 30;

  const baseCols = [...opts.columns];
  const showIndex = Boolean(opts.showIndex);
  const headers = showIndex ? ["#", ...baseCols] : baseCols;

  const columnWidth = Math.max(maxWidth, 3);
  const widths: Record<string, number> = {};
  for (const h of headers) widths[h] = Math.max(stringWidth(h), columnWidth);

  const drawLine = (where: "bottom" | "middle" | "top") => {
    let out = "";
    if (where === "top") out += style.topLeft;
    else if (where === "middle") out += style.left;
    else out += style.bottomLeft;

    for (const [i, h] of headers.entries()) {
      const w = widths[h] ?? 0;
      out += style.horizontal.repeat(w + padding * 2);
      if (i < headers.length - 1) {
        const appendValue = (() => {
          if (where === "top") return style.top;
          if (where === "middle") return style.cross;
          return style.bottom;
        })();
        out += appendValue;
      }
    }

    const appendValue = (() => {
      if (where === "top") return style.topRight;
      if (where === "middle") return style.right;
      return style.bottomRight;
    })();
    out += appendValue;
    write(indent + colors.gray(out));
  };

  const drawHeader = () => {
    drawLine("top");
    let line = colors.gray(style.vertical);
    for (const h of headers) {
      const align = opts.align?.[h] ?? (h === "#" ? "right" : "left");
      const label = h === "key" ? keyColor(h) : colors.cyan(h);
      const w = widths[h] ?? 0;
      line += padCell(label, w, align, padding) + colors.gray(style.vertical);
    }
    write(indent + line);
    drawLine("middle");
  };

  drawHeader();

  let count = 0;
  let isOpen = true;

  return {
    row: (data: Record<string, unknown>) => {
      if (!isOpen) return;
      assertRecordArgument(data, "stream.table row data");
      count += 1;
      let line = colors.gray(style.vertical);
      for (const h of headers) {
        const align = opts.align?.[h] ?? (h === "#" ? "right" : "left");
        let cell: string;
        if (h === "#") cell = colors.dim(String(count));
        else if (h === "key") {
          const v = data[h];
          cell = typeof v === "string" ? keyColor(v) : formatTableCell(v);
        } else {
          cell = formatTableCell(data[h]);
        }
        const w = widths[h] ?? 0;
        line += padCell(cell, w, align, padding) + colors.gray(style.vertical);
      }
      write(indent + line);
    },
    close: () => {
      if (!isOpen) return;
      drawLine("bottom");
      isOpen = false;
    },
  };
};
