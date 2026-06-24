import { stringWidth } from "../../utils/ansi";
import { getBackgroundOrIdentity } from "../../utils/background";
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
  assertStringArgument,
  assertStringOption,
} from "../../utils/options";
import { write } from "../../utils/writer";
import { assertBoxWidth, buildTopBorder, clampBoxWidth } from "../box/_shared";
import { dim } from "../colors";
import { getConfig } from "../config";
import { type RenderOptions, resolveRenderContext } from "../context";
import { BORDER_WIDTH, Closable, wrapTo } from "./_shared";

export interface BoxStream extends Closable {
  write: (text: string) => void;
  writeln: (text: string) => void;
}
export interface BoxStreamOptions {
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

const validateBoxStreamOptions = (options: BoxStreamOptions) => {
  assertPlainOptionsObject(options, "stream.box options");
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

export const box = (options: BoxStreamOptions = {}): BoxStream => {
  validateBoxStreamOptions(options);
  const ctx = resolveRenderContext(options);
  const explicitWidth = options.width !== undefined;
  let width = options.width ?? ctx.getWidth();
  const styleName = options.style ?? getConfig().defaults?.style ?? "single";
  const paddingX = options.paddingX ?? options.padding ?? 0;
  const paddingY = options.paddingY ?? options.padding ?? 0;
  const colorFn = options.borderColor ?? dim;
  const titleAlign = options.titleAlign ?? "center";
  if (explicitWidth) assertBoxWidth(width, paddingX);
  else width = clampBoxWidth(width, paddingX);

  const style = getLineStyle(styleName);
  const innerWidth = Math.max(0, width - BORDER_WIDTH);
  const maxContentWidth = Math.max(0, innerWidth - paddingX * 2);

  const hasBackground = Boolean(options.background);
  const bgFn = getBackgroundOrIdentity(options.background);

  const paint = (s: string) => (hasBackground ? bgFn(s) : s);
  const border = (s: string) => (hasBackground ? bgFn(colorFn(s)) : colorFn(s));

  const leftBorder = border(style.vertical);
  const rightBorder = border(style.vertical);

  const indent = " ".repeat(ctx.offset);

  write(
    indent +
      buildTopBorder({
        width,
        styleName,
        colorFn,
        title: options.title,
        titleAlign,
        titleColor: options.titleColor,
        background: hasBackground ? bgFn : undefined,
      }),
  );

  // top vertical padding
  const padBlank = " ".repeat(innerWidth);
  const padLine = leftBorder + paint(padBlank) + rightBorder;
  for (let i = 0; i < paddingY; i++) write(indent + padLine);

  let isOpen = true;

  const printContentLine = (raw: string) => {
    if (!isOpen) return;
    const totalPad = Math.max(0, innerWidth - stringWidth(raw) - paddingX * 2);
    const leftPad = paint(" ".repeat(paddingX));
    const body = paint(raw);
    const rightPad = paint(" ".repeat(paddingX + totalPad));
    let content = leftPad + body + rightPad;
    if (stringWidth(content) < innerWidth) {
      content += paint(" ".repeat(innerWidth - stringWidth(content)));
    }
    write(indent + leftBorder + content + rightBorder);
  };

  return {
    write: (text: string) => {
      if (!isOpen) return;
      assertStringArgument(text, "stream.box write text");
      const chunks = text.split(/\r?\n/);
      for (const chunk of chunks) {
        if (!chunk) {
          printContentLine("");
          continue;
        }
        for (const seg of wrapTo(chunk, maxContentWidth)) printContentLine(seg);
      }
    },
    writeln: (text: string) => {
      if (!isOpen) return;
      assertStringArgument(text, "stream.box writeln text");
      for (const seg of wrapTo(text, maxContentWidth)) printContentLine(seg);
    },
    close: () => {
      if (!isOpen) return;
      for (let i = 0; i < paddingY; i++) write(indent + padLine);
      const bottom = colorFn(
        style.bottomLeft + style.horizontal.repeat(Math.max(0, innerWidth)) + style.bottomRight,
      );
      write(indent + (hasBackground ? bgFn(bottom) : bottom));
      isOpen = false;
    },
  };
};
