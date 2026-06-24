import type { RenderContext, RenderOptions } from "../context";
import { stringWidth } from "../../utils/ansi";
import { applyBgToSegments, getBackgroundOrIdentity } from "../../utils/background";
import {
  assertBackgroundColorOption,
  assertColorFunctionOption,
  assertForegroundColorOption,
  type BackgroundColorOption,
  type ForegroundColorOption,
} from "../../utils/colors";
import { assertLineStyleOption, getLineStyle, type LineStyleName } from "../../utils/line-styles";
import {
  ALIGN_VALUES,
  assertEnumOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringOption,
} from "../../utils/options";
import { renderALS } from "../../utils/render-als";
import { applyTextWrapping } from "../../utils/string";
import { isPromiseLike, renderAndReturn, write } from "../../utils/writer";
import { dim } from "../colors";
import { getConfig } from "../config";
import { createContext, resolveRenderContext } from "../context";
import { assertBoxWidth, BORDER_WIDTH, buildTopBorder, clampBoxWidth } from "./_shared";

export interface BoxOptions {
  offset?: RenderOptions["offset"];
  width?: number;
  style?: LineStyleName;
  borderColor?: ForegroundColorOption;
  background?: BackgroundColorOption;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  title?: string;
  titleAlign?: "center" | "left" | "right";
  titleColor?: (text: string) => string;
  renderContext?: RenderOptions["renderContext"];
}

type BoxContent = (() => unknown) | string;
type BoxCallbackResult<T> = T extends PromiseLike<unknown> ? Promise<string> : string;

const validateBoxOptions = (options: BoxOptions) => {
  assertNonNegativeIntegerOption(options.width, "width");
  assertLineStyleOption(options.style, "style");
  assertForegroundColorOption(options.borderColor, "borderColor");
  assertBackgroundColorOption(options.background, "background");
  assertNonNegativeIntegerOption(options.padding, "padding");
  assertNonNegativeIntegerOption(options.paddingX, "paddingX");
  assertNonNegativeIntegerOption(options.paddingY, "paddingY");
  assertStringOption(options.title, "title");
  assertEnumOption(options.titleAlign, "titleAlign", ALIGN_VALUES);
  assertColorFunctionOption(options.titleColor, "titleColor");
};

const createBoxContext = (maxWidth: number) => {
  const innerContext = createContext(0).withOffset(0);
  Object.defineProperty(innerContext, "getWidth", {
    value: () => maxWidth,
    writable: false,
  });
  return innerContext;
};

const wrapLines = (lines: string[], maxWidth: number) => {
  const wrapped: string[] = [];
  for (const line of lines) {
    const segments = applyTextWrapping(line, maxWidth, "");
    wrapped.push(...segments);
  }
  return wrapped;
};

interface RenderBoxParams {
  wrappedLines: string[];
  width: number;
  styleName: LineStyleName;
  colorFn: (s: string) => string;
  bgFn: (s: string) => string;
  hasBg: boolean;
  boxStyle: ReturnType<typeof getLineStyle>;
  paddingX: number;
  paddingY: number;
  innerWidth: number;
  ctx: RenderContext;
  title?: string;
  titleAlign: "center" | "left" | "right";
  titleColor?: (text: string) => string;
}

const renderBox = (params: RenderBoxParams) => {
  const {
    wrappedLines,
    width,
    styleName,
    colorFn,
    bgFn,
    hasBg,
    boxStyle,
    paddingX,
    paddingY,
    innerWidth,
    ctx,
    title,
    titleAlign,
    titleColor,
  } = params;

  const boxLines: string[] = [];

  boxLines.push(
    buildTopBorder({
      width,
      styleName,
      colorFn,
      title,
      titleAlign,
      titleColor,
      background: hasBg ? bgFn : undefined,
    }),
  );

  const leftBorder = hasBg ? bgFn(colorFn(boxStyle.vertical)) : colorFn(boxStyle.vertical);
  const rightBorder = hasBg ? bgFn(colorFn(boxStyle.vertical)) : colorFn(boxStyle.vertical);
  const paddingLine = leftBorder + bgFn(" ".repeat(innerWidth)) + rightBorder;

  for (let i = 0; i < paddingY; i++) {
    boxLines.push(paddingLine);
  }

  for (const line of wrappedLines) {
    const totalPadding = Math.max(0, innerWidth - stringWidth(line) - paddingX * 2);
    const leftPad = bgFn(" ".repeat(paddingX));
    const body = hasBg ? applyBgToSegments(line, bgFn) : line;
    const rightPad = bgFn(" ".repeat(paddingX + totalPadding));
    let bgContent = leftPad + body + rightPad;
    const visibleLen = stringWidth(bgContent);
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
  for (const line of boxLines) write(indent + line);
};

const renderBoxContent = (content: BoxContent, options: BoxOptions = {}): Promise<string> | string => {
  if (typeof content !== "string" && typeof content !== "function") {
    throw new TypeError("picoprint box content must be a string or function");
  }
  assertPlainOptionsObject(options as unknown, "box options");
  validateBoxOptions(options);
  const ctx = resolveRenderContext(options);
  const explicitWidth = options.width !== undefined;
  let width = options.width ?? ctx.getWidth();
  const styleName = options.style ?? getConfig().defaults?.style ?? "single";
  const paddingX = options.paddingX ?? options.padding ?? 0;
  const paddingY = options.paddingY ?? options.padding ?? 0;
  const titleAlign = options.titleAlign ?? "center";
  if (explicitWidth) assertBoxWidth(width, paddingX);
  else width = clampBoxWidth(width, paddingX);

  const boxStyle = getLineStyle(styleName);
  const colorFn = options.borderColor ?? dim;
  const hasBg = Boolean(options.background);
  const bgFn = getBackgroundOrIdentity(options.background);

  const innerWidth = width - BORDER_WIDTH;
  const maxContentWidth = innerWidth - paddingX * 2;

  if (typeof content === "function") {
    const renderParams = {
      width,
      styleName,
      colorFn,
      bgFn,
      hasBg,
      boxStyle,
      paddingX,
      paddingY,
      innerWidth,
      ctx,
      title: options.title,
      titleAlign,
      titleColor: options.titleColor,
    };

    const boxCtx = createBoxContext(maxContentWidth);
    const buffer: string[] = [];
    const store = {
      writer: (line: string) => buffer.push(line),
      renderContext: boxCtx,
    };

    const finalize = (): string => {
      const wrappedLines = wrapLines(buffer, maxContentWidth);
      return renderAndReturn(() => renderBox({ wrappedLines, ...renderParams }));
    };

    const rawResult = renderALS.run(store, () => {
      const result = content();
      return isPromiseLike(result) ? Promise.resolve(result) : result;
    });

    if (isPromiseLike(rawResult)) {
      return Promise.resolve(rawResult).then(finalize);
    }

    return finalize();
  }

  return renderAndReturn(() => {
    const contentLines = content.split("\n");

    const wrappedLines = wrapLines(contentLines, maxContentWidth);
    renderBox({
      wrappedLines,
      width,
      styleName,
      colorFn,
      bgFn,
      hasBg,
      boxStyle,
      paddingX,
      paddingY,
      innerWidth,
      ctx,
      title: options.title,
      titleAlign,
      titleColor: options.titleColor,
    });
  });
};

export function box(content: string, options?: BoxOptions): string;
export function box<T>(content: () => T, options?: BoxOptions): BoxCallbackResult<T>;
export function box(content: BoxContent, options: BoxOptions = {}): Promise<string> | string {
  return renderBoxContent(content, options);
}

function boxPanel(content: string, options?: Partial<BoxOptions>): string;
function boxPanel<T>(content: () => T, options?: Partial<BoxOptions>): BoxCallbackResult<T>;
function boxPanel(first: BoxContent, second?: Partial<BoxOptions>): Promise<string> | string {
  assertPlainOptionsObject(second, "box.panel options");
  const opts: BoxOptions = { style: "rounded", padding: 1, ...second };
  return renderBoxContent(first, opts);
}
box.panel = boxPanel;
