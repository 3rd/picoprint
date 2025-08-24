import { stripAnsi } from "../../utils/ansi";
import { getLineStyle, type LineStyleName } from "../../utils/line-styles";
import { colors, keyColor } from "../colors";
import { getCurrentContext } from "../context";

export interface TableOptions {
  columns?: string[];
  maxWidth?: number;
  align?: Record<string, "center" | "left" | "right">;
  showIndex?: boolean;
  compact?: boolean;
  style?: LineStyleName;
}

export interface CSVOptions {
  separator?: string;
  header?: boolean;
  quoted?: boolean;
}

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

const padCell = (
  str: string,
  width: number,
  alignment: "center" | "left" | "right",
  padding: number,
): string => {
  const stripped = stripAnsi(str);
  let truncated = str;

  if (stripped.length > width) {
    truncated = `${str.slice(0, Math.max(0, width - 3))}...`;
  }

  const contentWidth = stripAnsi(truncated).length;
  const totalPadding = width - contentWidth;

  let result = " ".repeat(padding);

  switch (alignment) {
    case "right": {
      result += " ".repeat(totalPadding) + truncated;
      break;
    }
    case "center": {
      const leftPad = Math.floor(totalPadding / 2);
      const rightPad = totalPadding - leftPad;
      result += " ".repeat(leftPad) + truncated + " ".repeat(rightPad);
      break;
    }
    default: {
      result += truncated + " ".repeat(totalPadding);
    }
  }

  result += " ".repeat(padding);
  return result;
};

export const table = (data: unknown, options: TableOptions = {}) => {
  const ctx = getCurrentContext();
  const terminalWidth = ctx.getWidth();
  const indent = " ".repeat(ctx.offset);
  const {
    columns,
    maxWidth = 30,
    align = {},
    showIndex = false,
    compact = false,
    style = "single",
  } = options;
  const lineStyle = getLineStyle(style);

  let rows: Record<string, unknown>[] = [];
  let headers: string[] = [];

  if (Array.isArray(data)) {
    rows = data;
    if (rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
      headers = columns || Object.keys(rows[0]);
    } else {
      headers = ["value"];
      rows = rows.map((value) => ({ value }));
    }
  } else if (data instanceof Map) {
    headers = ["key", "value"];
    rows = Array.from(data.entries()).map(([key, value]) => ({ key, value }));
  } else if (typeof data === "object" && data !== null) {
    headers = ["key", "value"];
    rows = Object.entries(data).map(([key, value]) => ({ key, value }));
  } else {
    console.log(colors.red("Error: Invalid data for table"));
    return;
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

    console.log(indent + colors.gray(line.slice(0, Math.min(line.length, terminalWidth))));
  };

  drawLine("top");
  let headerLine = colors.gray(lineStyle.vertical);
  for (const header of headers) {
    const width = columnWidths[header] || 0;
    const alignment = align[header] || "left";
    const padded = padCell(colors.cyan(header), width, alignment, padding);
    headerLine += padded + colors.gray(lineStyle.vertical);
  }
  console.log(indent + headerLine);
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
    console.log(indent + rowLine);
  }

  drawLine("bottom");
};

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

  table(rows, {
    style: "single",
    ...options,
    columns: ["key", "left", "right", "match"],
    align: { ...options.align, match: "center" },
  });
};
