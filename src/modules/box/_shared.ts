import { stripAnsi, truncateAnsi } from "@/utils/ansi";
import { getLineStyle, type LineStyleName } from "@/utils/line-styles";

export const BORDER_WIDTH = 2;

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
  const titleLength = stripAnsi(titleWithSpaces).length;

  if (titleLength >= innerWidth) {
    const truncated = truncateAnsi(titleWithSpaces, Math.max(0, innerWidth));
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
