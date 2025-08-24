import { colors, keyColor } from "@/modules/colors";
import { getCurrentContext, type RenderContext } from "@/modules/context";
import { stripAnsi } from "@/utils/ansi";
import { getLineStyle, type LineStyleName } from "@/utils/line-styles";
import { Closable, visibleLen } from "./_shared";

export interface TableStreamOptions {
  columns: string[];
  maxWidth?: number; // per-column
  align?: Record<string, "center" | "left" | "right">;
  showIndex?: boolean;
  compact?: boolean;
  style?: LineStyleName;
  context?: RenderContext;
}
export interface TableStream extends Closable {
  row: (data: Record<string, unknown>) => void;
}

const padCell = (
  str: string,
  width: number,
  alignment: "center" | "left" | "right",
  padding: number,
): string => {
  const stripped = stripAnsi(str);
  let out = str;
  if (stripped.length > width) out = `${str.slice(0, Math.max(0, width - 3))}...`;
  const content = stripAnsi(out).length;
  const total = width - content;
  let res = " ".repeat(padding);
  if (alignment === "right") res += " ".repeat(total) + out;
  else if (alignment === "center") {
    const left = Math.floor(total / 2),
      right = total - left;
    res += " ".repeat(left) + out + " ".repeat(right);
  } else res += out + " ".repeat(total);
  res += " ".repeat(padding);
  return res;
};

const formatTableCell = (value: unknown): string => {
  if (value === null) return colors.gray("null");
  if (value === undefined) return colors.gray("undefined");
  if (typeof value === "boolean") return colors.magenta(String(value));
  if (typeof value === "number") return colors.yellow(String(value));
  if (typeof value === "bigint") return colors.yellow(`${value}n`);
  if (value instanceof Date) return colors.cyan(value.toISOString());
  if (typeof value === "string") return colors.green(value);
  if (Array.isArray(value)) return colors.cyan(`[Array(${value.length})]`);
  if (typeof value === "object") return colors.cyan("[Object]");
  return String(value);
};

export const table = (opts: TableStreamOptions): TableStream => {
  const ctx = opts.context ?? getCurrentContext();
  const indent = " ".repeat(ctx.offset);
  const styleName = opts.style ?? "single";
  const style = getLineStyle(styleName);
  const compact = opts.compact ?? false;
  const padding = compact ? 1 : 2;
  const maxWidth = opts.maxWidth ?? 30;

  const baseCols = [...opts.columns];
  const showIndex = Boolean(opts.showIndex);
  const headers = showIndex ? ["#", ...baseCols] : baseCols;

  const widths: Record<string, number> = {};
  for (const h of headers) widths[h] = Math.max(visibleLen(h), 3, Math.min(maxWidth, visibleLen(h)));

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
    console.log(indent + colors.gray(out));
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
    console.log(indent + line);
    drawLine("middle");
  };

  drawHeader();

  let count = 0;

  return {
    row: (data: Record<string, unknown>) => {
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
      console.log(indent + line);
    },
    close: () => {
      drawLine("bottom");
    },
  };
};
