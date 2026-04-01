import { colors, keyColor } from "@/modules/colors";
import { getCurrentContext, type RenderContext } from "@/modules/context";
import { formatTableCell, padCell } from "@/modules/table/_shared";
import { getLineStyle, type LineStyleName } from "@/utils/line-styles";
import { write } from "@/utils/writer";
import { Closable, visibleLen } from "./_shared";

export interface TableStreamOptions {
  columns: string[];
  maxWidth?: number; // per-column
  align?: Record<string, "center" | "left" | "right">;
  showIndex?: boolean;
  compact?: boolean;
  style?: LineStyleName;
  renderContext?: RenderContext;
}
export interface TableStream extends Closable {
  row: (data: Record<string, unknown>) => void;
}

export const table = (opts: TableStreamOptions): TableStream => {
  const ctx = opts.renderContext ?? getCurrentContext();
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
      write(indent + line);
    },
    close: () => {
      drawLine("bottom");
    },
  };
};
