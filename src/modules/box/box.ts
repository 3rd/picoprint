import type { BackgroundColorFunction, ForegroundColorFunction } from "../../utils/colors";
import type { RenderContext } from "../context";
import { stripAnsi } from "../../utils/ansi";
import { applyBgToSegments, getBackgroundOrIdentity } from "../../utils/background";
import { getLineStyle, type LineStyleName } from "../../utils/line-styles";
import { applyTextWrapping } from "../../utils/string";
import { dim } from "../colors";
import { createContext, getCurrentContext, popContext, pushContext } from "../context";

export interface BoxOptions {
  width?: number;
  style?: LineStyleName;
  color?: ForegroundColorFunction;
  background?: BackgroundColorFunction;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  title?: string;
  titleAlign?: "center" | "left" | "right";
  titleColor?: (text: string) => string;
  context?: RenderContext;
}

const BORDER_WIDTH = 2;
const ELLIPSIS = "...";
const ELLIPSIS_LENGTH = 3;

const captureConsoleOutput = (fn: () => void, maxWidth: number) => {
  const originalLog = console.log;
  const captured: string[] = [];

  const innerContext = createContext(0).withOffset(0);
  Object.defineProperty(innerContext, "getWidth", {
    value: () => maxWidth,
    writable: false,
  });
  pushContext(innerContext);

  console.log = (...args: unknown[]) => {
    const text = args.map(String).join(" ");
    const lines = text.split(/\r?\n/);
    for (const line of lines) captured.push(line);
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
    popContext();
  }

  return captured;
};

const wrapLines = (lines: string[], maxWidth: number) => {
  const wrapped: string[] = [];
  for (const line of lines) {
    const segments = applyTextWrapping(line, maxWidth, "");
    wrapped.push(...segments);
  }
  return wrapped;
};

interface BorderOptions {
  width: number;
  styleName: LineStyleName;
  colorFn: (str: string) => string;
  title?: string;
  titleAlign: "center" | "left" | "right";
  titleColor?: (text: string) => string;
  background?: (s: string) => string;
}

const buildTopBorder = (options: BorderOptions) => {
  const { width, styleName, colorFn, title, titleAlign, titleColor, background } = options;
  const style = getLineStyle(styleName);
  const innerWidth = width - BORDER_WIDTH;

  if (!title) {
    const line = colorFn(style.topLeft + style.horizontal.repeat(Math.max(0, innerWidth)) + style.topRight);
    return background ? background(line) : line;
  }

  const titleWithSpaces = ` ${title} `;
  const titleLength = stripAnsi(titleWithSpaces).length;

  if (titleLength >= innerWidth) {
    const truncated = `${titleWithSpaces.slice(0, Math.max(0, innerWidth - ELLIPSIS_LENGTH))}${ELLIPSIS}`;
    return colorFn(style.topLeft + truncated + style.topRight);
  }

  const remainingWidth = innerWidth - titleLength;
  let leftWidth: number;
  let rightWidth: number;

  switch (titleAlign) {
    case "left": {
      leftWidth = 0;
      rightWidth = remainingWidth;
      break;
    }
    case "right": {
      leftWidth = remainingWidth;
      rightWidth = 0;
      break;
    }
    default: {
      leftWidth = Math.floor(remainingWidth / 2);
      rightWidth = remainingWidth - leftWidth;
      break;
    }
  }

  const displayTitle = titleColor ? titleColor(titleWithSpaces) : titleWithSpaces;

  const res =
    colorFn(style.topLeft + style.horizontal.repeat(Math.max(0, leftWidth))) +
    displayTitle +
    colorFn(style.horizontal.repeat(Math.max(0, rightWidth)) + style.topRight);
  return background ? background(res) : res;
};

export const box = (content: (() => void) | string, options: BoxOptions = {}) => {
  const ctx = options.context ?? getCurrentContext();
  const width = options.width ?? ctx.getWidth();
  const styleName = options.style ?? "single";
  const paddingX = options.paddingX ?? options.padding ?? 0;
  const paddingY = options.paddingY ?? options.padding ?? 0;
  const titleAlign = options.titleAlign ?? "center";

  const boxStyle = getLineStyle(styleName);
  const colorFn = options.color ?? dim;
  const hasBg = Boolean(options.background);
  const bgFn = getBackgroundOrIdentity(options.background);

  const innerWidth = width - BORDER_WIDTH;
  const maxContentWidth = innerWidth - paddingX * 2;

  const contentLines =
    typeof content === "function" ? captureConsoleOutput(content, maxContentWidth) : content.split("\n");

  const wrappedLines = wrapLines(contentLines, maxContentWidth);

  const boxLines: string[] = [];

  boxLines.push(
    buildTopBorder({
      width,
      styleName,
      colorFn,
      title: options.title,
      titleAlign,
      titleColor: options.titleColor,
      background: hasBg ? bgFn : undefined,
    }),
  );

  // fill vertical padding lines fully and paint the borders with background
  const leftBorder = hasBg ? bgFn(colorFn(boxStyle.vertical)) : colorFn(boxStyle.vertical);
  const rightBorder = hasBg ? bgFn(colorFn(boxStyle.vertical)) : colorFn(boxStyle.vertical);
  const paddingLine = leftBorder + bgFn(" ".repeat(innerWidth)) + rightBorder;

  for (let i = 0; i < paddingY; i++) {
    boxLines.push(paddingLine);
  }

  // if the last visible char is a nested box right border, carry parent's background
  for (const line of wrappedLines) {
    const totalPadding = Math.max(0, innerWidth - stripAnsi(line).length - paddingX * 2);
    const leftPad = bgFn(" ".repeat(paddingX));
    // Use applyBgToSegments to preserve existing ANSI foreground colors
    const body = hasBg ? applyBgToSegments(line, bgFn) : line;
    const rightPad = bgFn(" ".repeat(paddingX + totalPadding));
    let bgContent = leftPad + body + rightPad;
    const visibleLen = stripAnsi(bgContent).length;
    if (visibleLen < innerWidth) {
      bgContent = bgContent + bgFn(" ".repeat(innerWidth - visibleLen));
    }
    boxLines.push(leftBorder + bgContent + rightBorder);
  }

  for (let i = 0; i < paddingY; i++) {
    boxLines.push(paddingLine);
  }

  const bottom = colorFn(
    boxStyle.bottomLeft + boxStyle.horizontal.repeat(Math.max(0, innerWidth)) + boxStyle.bottomRight,
  );
  boxLines.push(hasBg ? bgFn(bottom) : bottom);

  const indent = " ".repeat(ctx.offset);
  for (const line of boxLines) console.log(indent + line);
};

box.frame = (content: string, options: Partial<BoxOptions> = {}) => {
  box(content, { ...options });
};

box.panel = (title: string, content: (() => void) | string, options: Partial<BoxOptions> = {}) => {
  box(content, { ...options, title, style: "rounded", padding: 1 });
};

box.nested = (
  content: (() => void) | string,
  parentContext?: RenderContext,
  options: Partial<BoxOptions> = {},
) => {
  const ctx = parentContext ?? getCurrentContext();
  const nestedContext = ctx.indent(2);
  box(content, { ...options, context: nestedContext });
};
