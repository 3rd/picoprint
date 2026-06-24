import {
  COLOR_START_REGEX,
  graphemeWidth,
  RESET_COLOR,
  splitGraphemes,
  stringWidth,
  stripAnsi,
} from "./ansi";

const QUOTE_WIDTH = 2;

// eslint-disable-next-line sonarjs/cognitive-complexity
export const applyTextWrapping = (str: string, maxWidth: number, indentStr: string) => {
  if (stringWidth(str) <= maxWidth) return [str];

  const lines: string[] = [];
  const colorMatch = COLOR_START_REGEX.exec(str);
  const startColor = colorMatch?.[1] ?? "";
  const content = stripAnsi(str);
  const isQuotedString = content.startsWith('"') && content.endsWith('"');

  // non-quoted text, wrap while preserving embedded ANSI codes and active color state
  if (!isQuotedString) {
    // eslint-disable-next-line no-control-regex
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
      if (nextEsc > i) {
        const segment = str.slice(i, nextEsc);
        for (const ch of splitGraphemes(segment)) {
          if (ch === "\n") {
            flushLine();
            continue;
          }
          const w = graphemeWidth(ch);
          if (visible > 0 && visible + w > maxWidth) flushLine();
          currentLine += ch;
          visible += w;
          if (visible >= maxWidth) {
            flushLine();
          }
        }
        i = nextEsc;
      }

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
          first === "38" ||
          (Number(first) >= 30 && Number(first) <= 37) ||
          (Number(first) >= 90 && Number(first) <= 97)
        ) {
          activeFg = seq;
        } else if (
          first === "48" ||
          (Number(first) >= 40 && Number(first) <= 47) ||
          (Number(first) >= 100 && Number(first) <= 107)
        ) {
          activeBg = seq;
        }

        i = (m.index ?? i) + seq.length;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine + RESET_COLOR);
    }

    return lines;
  }

  const innerContent = content.slice(1, -1);
  let chunk = "";
  let chunkWidth = 0;
  let isFirst = true;

  const pushChunk = (isLastChunk: boolean) => {
    const quoteSuffix = isLastChunk ? '"' : "";
    const prefix = isFirst ? `${startColor}"` : `${indentStr}${startColor}`;
    lines.push(`${prefix}${chunk}${quoteSuffix}${RESET_COLOR}`);
    isFirst = false;
    chunk = "";
    chunkWidth = 0;
  };

  for (const ch of splitGraphemes(innerContent)) {
    const w = graphemeWidth(ch);
    const budget = isFirst ? maxWidth - QUOTE_WIDTH : maxWidth;
    if (chunkWidth > 0 && chunkWidth + w > budget) pushChunk(false);
    chunk += ch;
    chunkWidth += w;
  }
  if (chunk.length > 0 || lines.length === 0) pushChunk(true);

  return lines;
};
