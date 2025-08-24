/* eslint-disable no-control-regex */
import { COLOR_START_REGEX, RESET_COLOR, stripAnsi } from "./ansi";

const QUOTE_WIDTH = 2;

// eslint-disable-next-line sonarjs/cognitive-complexity
export const applyTextWrapping = (str: string, maxWidth: number, indentStr: string) => {
  const stripped = stripAnsi(str);
  if (stripped.length <= maxWidth) return [str];

  const lines: string[] = [];
  const colorMatch = COLOR_START_REGEX.exec(str);
  const startColor = colorMatch?.[1] ?? "";
  const content = stripAnsi(str);
  const isQuotedString = content.startsWith('"') && content.endsWith('"');

  // non-quoted text, wrap while preserving embedded ANSI codes and active color state
  if (!isQuotedString) {
    const SGR = /\u001b\[([\d;]*)m/g;

    let i = 0;
    let visible = 0;
    let lineIndex = 0;
    let currentLine = "";
    let activeFg: string | null = null;
    let activeBg: string | null = null;

    const flushLine = () => {
      if (currentLine.length === 0) {
        lines.push(RESET_COLOR);
      } else {
        lines.push(currentLine + RESET_COLOR);
      }
      lineIndex++;
      visible = 0;
      // re-open active colors for the new line
      currentLine = (lineIndex > 0 ? indentStr : "") + (activeFg ?? "") + (activeBg ?? "");
    };

    while (i < str.length) {
      SGR.lastIndex = i;
      const m = SGR.exec(str);

      const nextEsc = m ? m.index : str.length;
      // plain segment up to next SGR
      if (nextEsc > i) {
        const segment = str.slice(i, nextEsc);
        for (const element of segment) {
          const ch = element ?? "";
          if (ch === "\n") {
            // hard line break inside the string
            flushLine();
            continue;
          }
          currentLine += ch;
          visible++;
          if (visible >= maxWidth) {
            flushLine();
          }
        }
        i = nextEsc;
      }

      // SGR sequence and update active state
      if (m && m[0]) {
        const seq = m[0];
        const params = m[1] ?? "";
        currentLine += seq;

        // update active state for foreground/background to re-open on wrapped lines
        const parts = params ? params.split(";") : [];
        const first = parts[0] ?? "";
        const isBareReset = params === ""; // ESC[m]
        if (isBareReset || parts.includes("0")) {
          activeFg = null;
          activeBg = null;
        } else if (first === "39") {
          activeFg = null;
        } else if (first === "49") {
          activeBg = null;
        } else if (
          // foreground
          first === "38" ||
          (Number(first) >= 30 && Number(first) <= 37) ||
          (Number(first) >= 90 && Number(first) <= 97)
        ) {
          activeFg = seq;
        } else if (
          // background
          first === "48" ||
          (Number(first) >= 40 && Number(first) <= 47) ||
          (Number(first) >= 100 && Number(first) <= 107)
        ) {
          activeBg = seq;
        }

        i = (m.index ?? i) + seq.length;
      }
    }

    // push remaining line if any content accumulated
    if (currentLine.length > 0) {
      lines.push(currentLine + RESET_COLOR);
    }

    return lines;
  }

  const innerContent = content.slice(1, -1);
  let currentPos = 0;
  let isFirst = true;

  while (currentPos < innerContent.length) {
    const remainingWidth = isFirst ? maxWidth - QUOTE_WIDTH : maxWidth;
    const chunk = innerContent.slice(currentPos, currentPos + remainingWidth);
    const isLastChunk = currentPos + remainingWidth >= innerContent.length;
    const quoteSuffix = isLastChunk ? '"' : "";
    const prefix = isFirst ? `${startColor}"` : `${indentStr}${startColor}`;

    lines.push(`${prefix}${chunk}${quoteSuffix}${RESET_COLOR}`);
    currentPos += remainingWidth;
    isFirst = false;
  }

  return lines;
};
