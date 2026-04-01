// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\u001b\[[\d;]*m/g;

export const stripAnsi = (str: string) => str.replace(ANSI_REGEX, "");

// eslint-disable-next-line no-control-regex
export const COLOR_START_REGEX = /^(\u001b\[[\d;]*m)/;
export const RESET_COLOR = "\u001b[0m";

// truncate a string containing ANSI escapes to maxVisible visible characters
export const truncateAnsi = (str: string, maxVisible: number, ellipsis = "...") => {
  const stripped = stripAnsi(str);
  if (stripped.length <= maxVisible) return str;

  const effectiveEllipsis =
    maxVisible >= ellipsis.length ? ellipsis : ellipsis.slice(0, Math.max(0, maxVisible));
  const target = Math.max(0, maxVisible - effectiveEllipsis.length);
  let visible = 0;
  let i = 0;

  // eslint-disable-next-line no-control-regex
  const re = /\u001b\[[\d;]*m/g;
  let match: RegExpExecArray | null;
  let lastEnd = 0;

  while ((match = re.exec(str)) !== null) {
    // count visible chars before this escape
    for (let j = lastEnd; j < match.index && visible < target; j++) {
      visible++;
      i = j + 1;
    }
    if (visible >= target) break;
    // skip the escape sequence itself
    i = match.index + match[0].length;
    lastEnd = i;
  }

  // count remaining visible chars after last escape
  if (visible < target) {
    for (let j = lastEnd; j < str.length && visible < target; j++) {
      visible++;
      i = j + 1;
    }
  }

  return str.slice(0, i) + RESET_COLOR + effectiveEllipsis;
};
