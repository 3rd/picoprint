import type { BackgroundColorFunction, ForegroundColorFunction } from "@/utils/colors";
import { stripAnsi } from "@/utils/ansi";
import { applyBgToSegments, getBackgroundOrIdentity } from "@/utils/background";
import { getLineStyle, type LineStyleName } from "@/utils/line-styles";
import { renderALS } from "@/utils/render-als";
import { applyTextWrapping } from "@/utils/string";
import { renderAndReturn, write } from "@/utils/writer";
import type { RenderContext } from "../context";
import { dim } from "../colors";
import { getConfig } from "../config";
import { createContext, getCurrentContext } from "../context";
import { BORDER_WIDTH, buildTopBorder } from "./_shared";

export interface BoxOptions {
  width?: number;
  style?: LineStyleName;
  borderColor?: ForegroundColorFunction;
  background?: BackgroundColorFunction;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  title?: string;
  titleAlign?: "center" | "left" | "right";
  titleColor?: (text: string) => string;
  renderContext?: RenderContext;
}

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
    const totalPadding = Math.max(0, innerWidth - stripAnsi(line).length - paddingX * 2);
    const leftPad = bgFn(" ".repeat(paddingX));
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
  for (const line of boxLines) write(indent + line);
};

export function box(content: string, options?: BoxOptions): string;
export function box<T>(content: () => T, options?: BoxOptions): T;
export function box<T>(content: () => Promise<T>, options?: BoxOptions): Promise<T>;
export function box<T = void>(
  content: (() => Promise<T>) | (() => T) | string,
  options: BoxOptions = {},
): Promise<T> | T | string {
  const ctx = options.renderContext ?? getCurrentContext();
  const width = options.width ?? ctx.getWidth();
  const styleName = options.style ?? getConfig().defaults?.style ?? "single";
  const paddingX = options.paddingX ?? options.padding ?? 0;
  const paddingY = options.paddingY ?? options.padding ?? 0;
  const titleAlign = options.titleAlign ?? "center";

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
    const store = { writer: (line: string) => buffer.push(line), renderContext: boxCtx };

    const finalize = <V>(value: V): V => {
      const wrappedLines = wrapLines(buffer, maxContentWidth);
      renderBox({ wrappedLines, ...renderParams });
      return value;
    };

    const rawResult = renderALS.run(store, () => (content as () => Promise<T> | T)());

    if (rawResult instanceof Promise) {
      return rawResult.then(finalize) as Promise<T>;
    }

    return finalize(rawResult);
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
}

function boxPanel(title: string, content: string, options?: Partial<BoxOptions>): string;
function boxPanel<T>(title: string, content: () => T, options?: Partial<BoxOptions>): T;
function boxPanel<T>(title: string, content: () => Promise<T>, options?: Partial<BoxOptions>): Promise<T>;
function boxPanel<T>(
  title: string,
  content: (() => Promise<T>) | (() => T) | string,
  options: Partial<BoxOptions> = {},
): Promise<T> | T | string {
  const opts: BoxOptions = { ...options, title, style: "rounded", padding: 1 };
  if (typeof content === "string") return box(content, opts);
  return box(content as () => T, opts);
}
box.panel = boxPanel;
