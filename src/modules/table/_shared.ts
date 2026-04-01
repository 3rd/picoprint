import { stripAnsi, truncateAnsi } from "@/utils/ansi";

export { formatValueColored as formatTableCell } from "@/utils/format-value";

type CellAlignment = "center" | "left" | "right";

export const padCell = (str: string, width: number, alignment: CellAlignment, padding: number) => {
  const stripped = stripAnsi(str);
  const truncated = stripped.length > width ? truncateAnsi(str, width) : str;

  const contentWidth = stripAnsi(truncated).length;
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
