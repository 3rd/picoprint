import { stringWidth, truncateAnsi } from "../../utils/ansi";
import { getLineStyle, type LineStyleName } from "../../utils/line-styles";

export const BORDER_WIDTH = 2;

const minBoxWidth = (paddingX = 0) => BORDER_WIDTH + paddingX * 2 + 1;

export const assertBoxWidth = (width: number, paddingX = 0, message = "width") => {
  const minimumWidth = minBoxWidth(paddingX);
  if (width >= minimumWidth) return;
  const paddingDetail = paddingX > 0 ? ` for paddingX ${paddingX}` : "";
  throw new RangeError(`picoprint ${message} must be at least ${minimumWidth}${paddingDetail}`);
};

export const clampBoxWidth = (width: number, paddingX = 0) => Math.max(width, minBoxWidth(paddingX));

interface BorderOptions {
  width: number;
  styleName: LineStyleName;
  colorFn: (str: string) => string;
  title?: string;
  titleAlign: "center" | "left" | "right";
  titleColor?: (text: string) => string;
  background?: (s: string) => string;
}

export const buildTopBorder = (options: BorderOptions) => {
  const { width, styleName, colorFn, title, titleAlign, titleColor, background } = options;
  const style = getLineStyle(styleName);
  const innerWidth = width - BORDER_WIDTH;

  if (!title) {
    const line = colorFn(style.topLeft + style.horizontal.repeat(Math.max(0, innerWidth)) + style.topRight);
    return background ? background(line) : line;
  }

  const titleWithSpaces = ` ${title} `;
  const titleLength = stringWidth(titleWithSpaces);

  if (titleLength >= innerWidth) {
    const truncated = truncateAnsi(titleWithSpaces, Math.max(0, innerWidth));
    const displayTruncated = titleColor ? titleColor(truncated) : truncated;
    const line = colorFn(style.topLeft) + displayTruncated + colorFn(style.topRight);
    return background ? background(line) : line;
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
