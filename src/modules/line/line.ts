import type { RenderOptions } from "../context";
import { stringWidth } from "../../utils/ansi";
import {
  assertColorFunctionOption,
  assertForegroundColorOption,
  type ForegroundColorOption,
} from "../../utils/colors";
import { assertLineStyleOption, getLineStyle, type LineStyleName } from "../../utils/line-styles";
import {
  ALIGN_VALUES,
  assertEnumOption,
  assertFiniteNumberOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringArgument,
  assertStringOption,
  isPlainRecord,
} from "../../utils/options";
import { renderAndReturn, write } from "../../utils/writer";
import * as c from "../colors";
import { getConfig } from "../config";
import { resolveRenderContext } from "../context";

export interface LineOptions {
  offset?: RenderOptions["offset"];
  width?: number;
  style?: LineStyleName;
  color?: ForegroundColorOption;
  label?: string;
  labelAlign?: "center" | "left" | "right";
  padding?: number;
  separator?: { left: string; right: string } | false | string;
  labelColor?: (text: string) => string;
  renderContext?: RenderOptions["renderContext"];
}

type LineStyle = LineStyleName;
export type GradientLineOptions = {
  offset?: RenderOptions["offset"];
  renderContext?: RenderOptions["renderContext"];
  start: ForegroundColorOption;
  end: ForegroundColorOption;
};

const JOIN_CHARS_LENGTH = 2; // separator characters: "┤" + "├"
const MIN_LINE_SEGMENT = 3;

const validateLineOptions = (options: LineOptions) => {
  assertFiniteNumberOption(options.width, "width");
  assertLineStyleOption(options.style, "style");
  assertForegroundColorOption(options.color, "color");
  assertStringOption(options.label, "label");
  assertEnumOption(options.labelAlign, "labelAlign", ALIGN_VALUES);
  assertNonNegativeIntegerOption(options.padding, "padding");
  assertColorFunctionOption(options.labelColor, "labelColor");
  if (
    options.separator !== undefined &&
    options.separator !== false &&
    typeof options.separator !== "string"
  ) {
    if (!isPlainRecord(options.separator)) {
      throw new TypeError("picoprint separator must be a string, false, or an object");
    }
    assertStringArgument(options.separator.left, "separator.left");
    assertStringArgument(options.separator.right, "separator.right");
  }
};

const assertGradientColorOption = (value: unknown, optionName: string) => {
  if (value === undefined) throw new TypeError(`picoprint ${optionName} must be a function`);
  assertForegroundColorOption(value, optionName);
};

const validateGradientLineOptions = (options: Partial<GradientLineOptions> | undefined) => {
  if (options === undefined) {
    throw new TypeError("picoprint line.gradient options must be an object");
  }
  assertPlainOptionsObject(options as unknown, "line.gradient options");
  assertGradientColorOption(options.start, "line.gradient start");
  assertGradientColorOption(options.end, "line.gradient end");
};

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
  labelColor?: (text: string) => string;
}

const buildLabeledLine = (params: BuildLabeledLineParams) => {
  const { width, style, colorFn, label, align, padding, separator, labelColor } = params;
  const lineChar = getLineStyle(style as LineStyleName).horizontal;
  const labelWithPadding = " ".repeat(padding) + label + " ".repeat(padding);
  const labelLength = stringWidth(labelWithPadding);

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

  const displayLabel = labelColor ? labelColor(label) : label;
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

  const totalLength = stringWidth(leftPart) + stringWidth(middlePart) + stringWidth(rightPart);

  if (totalLength > width) {
    const excess = totalLength - width;
    const newRightLine = lineChar.repeat(Math.max(0, rightLine.length - excess));
    return `${colorFn(leftLine + leftSep)}${paddedDisplayLabel}${colorFn(rightSep + newRightLine)}`;
  }

  return colorFn(leftPart) + displayMiddlePart + colorFn(rightPart);
};

export const line = (options: LineOptions | string = {}) =>
  renderAndReturn(() => {
    if (options !== undefined && typeof options !== "string") {
      assertPlainOptionsObject(options as unknown, "line options");
    }
    const opts: LineOptions = typeof options === "string" ? { label: options } : options || {};
    validateLineOptions(opts);

    const ctx = resolveRenderContext(opts);
    const width = opts.width ?? ctx.getWidth();
    const style = opts.style ?? getConfig().defaults?.style ?? "single";
    const align = opts.labelAlign ?? "center";
    const padding = opts.padding ?? 1;

    const colorFn = opts.color ?? c.dim;
    const indent = " ".repeat(ctx.offset);

    if (opts.label) {
      write(
        indent +
          buildLabeledLine({
            width,
            style,
            colorFn,
            label: opts.label,
            align,
            padding,
            separator: opts.separator,
            labelColor: opts.labelColor,
          }),
      );
    } else {
      write(indent + buildSimpleLine(width, style, colorFn));
    }
  });

line.thin = (label?: string) => {
  return line({ style: "single", color: c.dim, label });
};

line.thick = (label?: string) => {
  return line({ style: "thick", color: c.gray, label });
};

line.double = (label?: string) => {
  return line({ style: "double", color: c.blue, label });
};

line.dashed = (label?: string) => {
  return line({ style: "dashed", color: c.dim, label });
};

line.dotted = (label?: string) => {
  return line({ style: "dotted", color: c.gray, label });
};

line.rounded = (label?: string) => {
  return line({ style: "rounded", color: c.green, label });
};

line.ascii = (label?: string) => {
  return line({ style: "ascii", color: c.white, label });
};

line.bold = (label?: string) => {
  return line({ style: "bold", color: c.yellow, label });
};

line.light = (label?: string) => {
  return line({ style: "light", color: c.dim, label });
};

line.section = (label?: string) => {
  return line({ style: "double", color: c.cyan, label, padding: 2 });
};

line.gradient = (options: GradientLineOptions) =>
  renderAndReturn(() => {
    validateGradientLineOptions(options);
    const ctx = resolveRenderContext(options);
    const width = ctx.getWidth();
    const indent = " ".repeat(ctx.offset);
    const lineChar = getLineStyle("single").horizontal;
    const base = lineChar.repeat(Math.max(0, width));
    const colored = c.gradient(base, options.start, options.end);
    write(indent + colored);
  });
