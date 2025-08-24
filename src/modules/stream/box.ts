import type { BackgroundColorFunction, ForegroundColorFunction } from "@/utils/colors";
import { dim } from "@/modules/colors";
import { getCurrentContext, type RenderContext } from "@/modules/context";
import { getBackgroundOrIdentity } from "@/utils/background";
import { getLineStyle, type LineStyleName } from "@/utils/line-styles";
import { BORDER_WIDTH, Closable, visibleLen, wrapTo } from "./_shared";

export interface BoxStream extends Closable {
  write: (text: string) => void;
  writeln: (text: string) => void;
}
export interface BoxStreamOptions {
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

const buildTopBorder = ({
  width,
  styleName,
  colorFn,
  title,
  titleAlign,
  titleColor,
  background,
}: {
  width: number;
  styleName: LineStyleName;
  colorFn: (s: string) => string;
  title?: string;
  titleAlign: "center" | "left" | "right";
  titleColor?: (s: string) => string;
  background?: (s: string) => string;
}) => {
  const style = getLineStyle(styleName);
  const innerWidth = width - BORDER_WIDTH;

  if (!title) {
    const line = colorFn(style.topLeft + style.horizontal.repeat(Math.max(0, innerWidth)) + style.topRight);
    return background ? background(line) : line;
  }

  const padTitle = ` ${title} `;
  const visibleTitleLength = visibleLen(padTitle);

  if (visibleTitleLength >= innerWidth) {
    const truncated = `${padTitle.slice(0, Math.max(0, innerWidth - 3))}...`;
    const line = colorFn(style.topLeft + truncated + style.topRight);
    return background ? background(line) : line;
  }

  const remainingWidth = innerWidth - visibleTitleLength;
  let left = 0,
    right = 0;
  switch (titleAlign) {
    case "left": {
      left = 0;
      right = remainingWidth;
      break;
    }
    case "right": {
      left = remainingWidth;
      right = 0;
      break;
    }
    default: {
      left = Math.floor(remainingWidth / 2);
      right = remainingWidth - left;
      break;
    }
  }
  const displayTitle = titleColor ? titleColor(padTitle) : padTitle;
  const result =
    colorFn(style.topLeft + style.horizontal.repeat(Math.max(0, left))) +
    displayTitle +
    colorFn(style.horizontal.repeat(Math.max(0, right)) + style.topRight);
  return background ? background(result) : result;
};

export const box = (options: BoxStreamOptions = {}): BoxStream => {
  const ctx = options.context ?? getCurrentContext();
  const width = options.width ?? ctx.getWidth();
  const styleName = options.style ?? "single";
  const paddingX = options.paddingX ?? options.padding ?? 0;
  const paddingY = options.paddingY ?? options.padding ?? 0;
  const colorFn = options.color ?? dim;
  const titleAlign = options.titleAlign ?? "center";

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

  // top
  console.log(
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
  for (let i = 0; i < paddingY; i++) console.log(indent + padLine);

  let isOpen = true;

  const printContentLine = (raw: string) => {
    if (!isOpen) return;
    const totalPad = Math.max(0, innerWidth - visibleLen(raw) - paddingX * 2);
    const leftPad = paint(" ".repeat(paddingX));
    const body = paint(raw);
    const rightPad = paint(" ".repeat(paddingX + totalPad));
    let content = leftPad + body + rightPad;
    if (visibleLen(content) < innerWidth) {
      content += paint(" ".repeat(innerWidth - visibleLen(content)));
    }
    console.log(indent + leftBorder + content + rightBorder);
  };

  return {
    write: (text: string) => {
      if (!isOpen) return;
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
      for (const seg of wrapTo(text, maxContentWidth)) printContentLine(seg);
    },
    close: () => {
      if (!isOpen) return;
      for (let i = 0; i < paddingY; i++) console.log(indent + padLine);
      const bottom = colorFn(
        style.bottomLeft + style.horizontal.repeat(Math.max(0, innerWidth)) + style.bottomRight,
      );
      console.log(indent + (hasBackground ? bgFn(bottom) : bottom));
      isOpen = false;
    },
  };
};
