export interface LineStyleChars {
  horizontal: string;
  vertical: string;
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
  cross: string;
  leftDouble?: string;
  rightDouble?: string;
}

export type LineStyleName =
  | "ascii"
  | "bold"
  | "dashed"
  | "dotted"
  | "double-single"
  | "double"
  | "light"
  | "rounded"
  | "single"
  | "thick";

const LINE_STYLES: Record<LineStyleName, LineStyleChars> = {
  single: {
    horizontal: "─",
    vertical: "│",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    left: "├",
    right: "┤",
    top: "┬",
    bottom: "┴",
    cross: "┼",
    leftDouble: "╞",
    rightDouble: "╡",
  },
  double: {
    horizontal: "═",
    vertical: "║",
    topLeft: "╔",
    topRight: "╗",
    bottomLeft: "╚",
    bottomRight: "╝",
    left: "╠",
    right: "╣",
    top: "╦",
    bottom: "╩",
    cross: "╬",
  },
  thick: {
    horizontal: "━",
    vertical: "┃",
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
    left: "┣",
    right: "┫",
    top: "┳",
    bottom: "┻",
    cross: "╋",
  },
  rounded: {
    horizontal: "─",
    vertical: "│",
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    left: "├",
    right: "┤",
    top: "┬",
    bottom: "┴",
    cross: "┼",
  },
  dashed: {
    horizontal: "╌",
    vertical: "╎",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    left: "├",
    right: "┤",
    top: "┬",
    bottom: "┴",
    cross: "┼",
  },
  dotted: {
    horizontal: "┅",
    vertical: "┇",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    left: "├",
    right: "┤",
    top: "┬",
    bottom: "┴",
    cross: "┼",
  },
  ascii: {
    horizontal: "-",
    vertical: "|",
    topLeft: "+",
    topRight: "+",
    bottomLeft: "+",
    bottomRight: "+",
    left: "+",
    right: "+",
    top: "+",
    bottom: "+",
    cross: "+",
  },
  "double-single": {
    horizontal: "═",
    vertical: "│",
    topLeft: "╒",
    topRight: "╕",
    bottomLeft: "╘",
    bottomRight: "╛",
    left: "╞",
    right: "╡",
    top: "╤",
    bottom: "╧",
    cross: "╪",
  },
  bold: {
    horizontal: "━",
    vertical: "┃",
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
    left: "┣",
    right: "┫",
    top: "┳",
    bottom: "┻",
    cross: "╋",
  },
  light: {
    horizontal: "─",
    vertical: "│",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    left: "├",
    right: "┤",
    top: "┬",
    bottom: "┴",
    cross: "┼",
    leftDouble: "╞",
    rightDouble: "╡",
  },
} as const;

export const getLineStyle = (styleName: LineStyleName = "single"): LineStyleChars => {
  return LINE_STYLES[styleName] || LINE_STYLES.single;
};

export const getAllStyleNames = (): LineStyleName[] => {
  return Object.keys(LINE_STYLES) as LineStyleName[];
};

export const isValidStyleName = (name: string): name is LineStyleName => {
  return name in LINE_STYLES;
};

export const getLineChar = (styleName: LineStyleName, charType: keyof LineStyleChars): string => {
  const style = getLineStyle(styleName);
  return style[charType] || "";
};

export const drawHorizontalLine = (width: number, styleName: LineStyleName = "single"): string => {
  const style = getLineStyle(styleName);
  return style.horizontal.repeat(Math.max(0, width));
};

export const drawVerticalLine = (height: number, styleName: LineStyleName = "single"): string[] => {
  const style = getLineStyle(styleName);
  const h = Math.max(0, height);
  return Array.from({ length: h }, () => style.vertical);
};

export const drawBox = (width: number, height: number, styleName: LineStyleName = "single"): string[] => {
  const style = getLineStyle(styleName);
  const lines: string[] = [];

  if (width <= 0 || height <= 0) return lines;

  const innerWidth = Math.max(0, width - 2);
  const topLine = style.topLeft + style.horizontal.repeat(innerWidth) + style.topRight;
  lines.push(topLine);

  for (let i = 0; i < height - 2; i++) {
    const middleLine = style.vertical + " ".repeat(innerWidth) + style.vertical;
    lines.push(middleLine);
  }

  if (height > 1) {
    const bottomLine = style.bottomLeft + style.horizontal.repeat(innerWidth) + style.bottomRight;
    lines.push(bottomLine);
  }

  return lines;
};

export interface TableBorderOptions {
  styleName?: LineStyleName;
  showVertical?: boolean;
  showHorizontal?: boolean;
}

export const getTableBorderChars = (options: TableBorderOptions = {}) => {
  const { styleName = "single", showVertical = true, showHorizontal = true } = options;

  const style = getLineStyle(styleName);

  return {
    horizontal: showHorizontal ? style.horizontal : "",
    vertical: showVertical ? style.vertical : "",
    topLeft: style.topLeft,
    topRight: style.topRight,
    bottomLeft: style.bottomLeft,
    bottomRight: style.bottomRight,
    left: style.left,
    right: style.right,
    top: style.top,
    bottom: style.bottom,
    cross: style.cross,
  };
};

export { LINE_STYLES };
