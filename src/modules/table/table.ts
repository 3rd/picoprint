import { stripAnsi } from "@/utils/ansi";
import { getLineStyle, type LineStyleName } from "@/utils/line-styles";
import { renderAndReturn, write } from "@/utils/writer";
import type { RenderContext } from "../context";
import { colors, keyColor } from "../colors";
import { getConfig } from "../config";
import { getCurrentContext } from "../context";
import { formatTableCell, padCell } from "./_shared";

export interface TableOptions {
  columns?: string[];
  maxWidth?: number;
  align?: Record<string, "center" | "left" | "right">;
  showIndex?: boolean;
  compact?: boolean;
  style?: LineStyleName;
  renderContext?: RenderContext;
}

export type TableData = Map<unknown, unknown> | Record<string, unknown> | unknown[];

export const table = (data: TableData, options: TableOptions = {}) =>
  renderAndReturn(() => {
    const ctx = options.renderContext ?? getCurrentContext();
    const terminalWidth = ctx.getWidth();
    const indent = " ".repeat(ctx.offset);
    const {
      columns,
      maxWidth = 30,
      align = {},
      showIndex = false,
      compact = getConfig().defaults?.compact ?? false,
      style = getConfig().defaults?.style ?? "single",
    } = options;
    const lineStyle = getLineStyle(style);

    let rows: Record<string, unknown>[] = [];
    let headers: string[] = [];

    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
        rows = data as Record<string, unknown>[];
        headers = columns || Object.keys(data[0] as Record<string, unknown>);
      } else {
        headers = ["value"];
        rows = data.map((value) => ({ value }));
      }
    } else if (data instanceof Map) {
      headers = ["key", "value"];
      rows = Array.from(data.entries()).map(([key, value]) => ({ key, value }));
    } else {
      headers = ["key", "value"];
      rows = Object.entries(data).map(([key, value]) => ({ key, value }));
    }

    if (showIndex) {
      headers = ["#", ...headers];
    }

    const columnWidths: Record<string, number> = {};

    for (const header of headers) {
      columnWidths[header] = header.length;
    }

    for (const [i, row] of rows.entries()) {
      if (showIndex) {
        const indexStr = String(i + 1);
        columnWidths["#"] = Math.max(columnWidths["#"] || 0, indexStr.length);
      }

      for (const header of headers) {
        if (header === "#") continue;
        const value = row[header];
        const str = formatTableCell(value);
        const len = stripAnsi(str).length;
        columnWidths[header] = Math.min(Math.max(columnWidths[header] || 0, len), maxWidth);
      }
    }

    const padding = compact ? 1 : 2;

    const drawLine = (position: "bottom" | "middle" | "top") => {
      let line = "";
      if (position === "top") {
        line = lineStyle.topLeft;
      } else if (position === "middle") {
        line = lineStyle.left;
      } else {
        line = lineStyle.bottomLeft;
      }

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (!header) continue;
        const width = columnWidths[header] || 0;
        line += lineStyle.horizontal.repeat(width + padding * 2);

        if (j < headers.length - 1) {
          if (position === "top") {
            line += lineStyle.top;
          } else if (position === "middle") {
            line += lineStyle.cross;
          } else {
            line += lineStyle.bottom;
          }
        }
      }

      if (position === "top") {
        line += lineStyle.topRight;
      } else if (position === "middle") {
        line += lineStyle.right;
      } else {
        line += lineStyle.bottomRight;
      }

      write(indent + colors.gray(line.slice(0, Math.min(line.length, terminalWidth))));
    };

    drawLine("top");
    let headerLine = colors.gray(lineStyle.vertical);
    for (const header of headers) {
      const width = columnWidths[header] || 0;
      const alignment = align[header] || "left";
      const padded = padCell(colors.cyan(header), width, alignment, padding);
      headerLine += padded + colors.gray(lineStyle.vertical);
    }
    write(indent + headerLine);
    drawLine("middle");

    for (const [i, row] of rows.entries()) {
      let rowLine = colors.gray(lineStyle.vertical);

      for (const header of headers) {
        const width = columnWidths[header] || 0;
        const alignment = align[header] || (header === "#" ? "right" : "left");

        let value: string;
        if (header === "#") {
          value = colors.dim(String(i + 1));
        } else if (header === "key") {
          const keyVal = row[header];
          value = typeof keyVal === "string" ? keyColor(keyVal) : formatTableCell(keyVal);
        } else {
          value = formatTableCell(row[header]);
        }

        const padded = padCell(value, width, alignment, padding);
        rowLine += padded + colors.gray(lineStyle.vertical);
      }
      write(indent + rowLine);
    }

    drawLine("bottom");
  });

export const compareInTable = (
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  options: Partial<TableOptions> = {},
) => {
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const rows = Array.from(allKeys).map((key) => ({
    key,
    left: left[key],
    right: right[key],
    match: left[key] === right[key] ? "✓" : "✗",
  }));

  return table(rows, {
    style: "single",
    ...options,
    columns: ["key", "left", "right", "match"],
    align: { ...options.align, match: "center" },
  });
};
