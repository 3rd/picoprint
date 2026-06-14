import { stringWidth, truncateAnsi } from "../../utils/ansi";

export { formatValueColored as formatTableCell } from "../../utils/format-value";

type CellAlignment = "center" | "left" | "right";

export const padCell = (str: string, width: number, alignment: CellAlignment, padding: number) => {
  const strWidth = stringWidth(str);
  const truncated = strWidth > width ? truncateAnsi(str, width) : str;

  const contentWidth = stringWidth(truncated);
  const totalPadding = Math.max(0, width - contentWidth);

  let result = " ".repeat(padding);

  switch (alignment) {
    case "right": {
      result += " ".repeat(totalPadding) + truncated;
      break;
    }
    case "center": {
      const leftPad = Math.floor(totalPadding / 2);
      const rightPad = totalPadding - leftPad;
      result += " ".repeat(leftPad) + truncated + " ".repeat(rightPad);
      break;
    }
    default: {
      result += truncated + " ".repeat(totalPadding);
    }
  }

  result += " ".repeat(padding);
  return result;
};
