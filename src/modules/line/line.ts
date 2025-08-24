import type { ForegroundColorFunction } from "../../utils/colors";
import type { RenderContext } from "../context";
import { stripAnsi } from "../../utils/ansi";
import { getLineStyle, type LineStyleName } from "../../utils/line-styles";
import * as c from "../colors";
import { getCurrentContext } from "../context";

export interface LineOptions {
  width?: number;
  style?: LineStyleName;
  color?: ForegroundColorFunction;
  label?: string;
  align?: "center" | "left" | "right";
  padding?: number;
  separator?: { left: string; right: string } | false | string;
  titleColor?: (text: string) => string;
  context?: RenderContext;
}

type LineStyle = LineStyleName;

const JOIN_CHARS_LENGTH = 2; // separator characters: "┤" + "├"
const MIN_LINE_SEGMENT = 3;

const buildSimpleLine = (width: number, style: LineStyle, colorFn: (str: string) => string) => {
  const lineChar = getLineStyle(style as LineStyleName).horizontal;
  return colorFn(lineChar.repeat(Math.max(0, width)));
};

interface BuildLabeledLineParams {
  width: number;
  style: LineStyle;
  colorFn: (str: string) => string;
  label: string;
  align: "center" | "left" | "right";
  padding: number;
  separator?: { left: string; right: string } | false | string;
  titleColor?: (text: string) => string;
}

const buildLabeledLine = (params: BuildLabeledLineParams) => {
  const { width, style, colorFn, label, align, padding, separator, titleColor } = params;
  const lineChar = getLineStyle(style as LineStyleName).horizontal;
  const labelWithPadding = " ".repeat(padding) + label + " ".repeat(padding);
  const labelLength = stripAnsi(labelWithPadding).length;

  const totalLabelSection = labelLength + JOIN_CHARS_LENGTH;
  const remainingWidth = Math.max(0, width - totalLabelSection);

  let leftWidth: number;
  let rightWidth: number;

  switch (align) {
    case "left": {
      leftWidth = Math.min(MIN_LINE_SEGMENT, remainingWidth);
      rightWidth = remainingWidth - leftWidth;
      break;
    }
    case "right": {
      rightWidth = Math.min(MIN_LINE_SEGMENT, remainingWidth);
      leftWidth = remainingWidth - rightWidth;
      break;
    }
    default: {
      leftWidth = Math.floor(remainingWidth / 2);
      rightWidth = remainingWidth - leftWidth;
      break;
    }
  }

  const leftLine = lineChar.repeat(Math.max(0, leftWidth));
  const rightLine = lineChar.repeat(Math.max(0, rightWidth));

  const displayLabel = titleColor ? titleColor(label) : label;
  const paddingStr = " ".repeat(padding);
  const paddedLabel = `${paddingStr}${label}${paddingStr}`;
  const paddedDisplayLabel = `${paddingStr}${displayLabel}${paddingStr}`;

  if (separator === false) {
    return `${colorFn(leftLine)}${paddedDisplayLabel}${colorFn(rightLine)}`;
  }

  let leftSep: string;
  let rightSep: string;

  if (typeof separator === "string") {
    leftSep = separator;
    rightSep = separator;
  } else if (separator && typeof separator === "object") {
    leftSep = separator.left;
    rightSep = separator.right;
  } else {
    const lineStyle = getLineStyle(style as LineStyleName);
    leftSep = lineStyle.right;
    rightSep = lineStyle.left;
  }

  const leftPart = leftLine + leftSep;
  const rightPart = rightSep + rightLine;
  const middlePart = paddedLabel;
  const displayMiddlePart = paddedDisplayLabel;

  const totalLength = stripAnsi(leftPart).length + stripAnsi(middlePart).length + stripAnsi(rightPart).length;

  if (totalLength > width) {
    const excess = totalLength - width;
    const newRightLine = lineChar.repeat(Math.max(0, rightLine.length - excess));
    return `${colorFn(leftLine + leftSep)}${paddedDisplayLabel}${colorFn(rightSep + newRightLine)}`;
  }

  return colorFn(leftPart) + displayMiddlePart + colorFn(rightPart);
};

export const line = (options: LineOptions | string = {}) => {
  const opts: LineOptions = typeof options === "string" ? { label: options } : options || {};

  const ctx = opts.context ?? getCurrentContext();
  const width = opts.width ?? ctx.getWidth();
  const style = opts.style ?? "single";
  const align = opts.align ?? "center";
  const padding = opts.padding ?? 1;

  const colorFn = opts.color ?? c.dim;
  const indent = " ".repeat(ctx.offset);

  if (opts.label) {
    console.log(
      indent +
        buildLabeledLine({
          width,
          style,
          colorFn,
          label: opts.label,
          align,
          padding,
          separator: opts.separator,
          titleColor: opts.titleColor,
        }),
    );
  } else {
    console.log(indent + buildSimpleLine(width, style, colorFn));
  }
};

line.thin = (label?: string) => {
  line({ style: "single", color: c.dim, label });
};

line.thick = (label?: string) => {
  line({ style: "thick", color: c.gray, label });
};

line.double = (label?: string) => {
  line({ style: "double", color: c.blue, label });
};

line.dashed = (label?: string) => {
  line({ style: "dashed", color: c.dim, label });
};

line.dotted = (label?: string) => {
  line({ style: "dotted", color: c.gray, label });
};

line.rounded = (label?: string) => {
  line({ style: "rounded", color: c.green, label });
};

line.ascii = (label?: string) => {
  line({ style: "ascii", color: c.white, label });
};

line.bold = (label?: string) => {
  line({ style: "bold", color: c.yellow, label });
};

line.light = (label?: string) => {
  line({ style: "light", color: c.dim, label });
};

line.section = (label: string) => {
  line({ style: "double", color: c.cyan, label, padding: 2 });
};

line.gradient = (options: {
  context?: RenderContext;
  start: ForegroundColorFunction;
  end: ForegroundColorFunction;
}) => {
  const ctx = options.context ?? getCurrentContext();
  const width = ctx.getWidth();
  const indent = " ".repeat(ctx.offset);
  const lineChar = getLineStyle("single").horizontal;
  const base = lineChar.repeat(Math.max(0, width));
  const colored = c.gradient(base, options.start, options.end);
  console.log(indent + colored);
};
