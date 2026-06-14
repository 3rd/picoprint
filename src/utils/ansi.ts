/* eslint-disable no-control-regex */
const ANSI_REGEX = /\u001b\[[\d;]*m/g;

export const stripAnsi = (str: string) => str.replace(ANSI_REGEX, "");

export const COLOR_START_REGEX = /^(\u001b\[[\d;]*m)/;
export const RESET_COLOR = "\u001b[0m";

const ZERO_WIDTH_CODE_POINTS = new Set([0xFE_0F, 0xFE_FF, 0x20_0B, 0x20_0C, 0x20_0D]);
const KEYCAP_CODE_POINT = 0x20_E3;
const EMOJI_MODIFIER_START = 0x1_F3_FB;
const EMOJI_MODIFIER_END = 0x1_F3_FF;
const EMOJI_CLUSTER_REGEX = /\p{Extended_Pictographic}/u;
const KEYCAP_CLUSTER_REGEX = /[\u0023-\u0039]\uFE0F?\u20E3/u;
const intlWithSegmenter = Intl as {
  Segmenter?: new (
    locale?: string,
    options?: { granularity?: "grapheme" },
  ) => { segment: (input: string) => Iterable<{ segment: string }> };
} & typeof Intl;
const graphemeSegmenter = intlWithSegmenter.Segmenter
  ? new intlWithSegmenter.Segmenter(undefined, { granularity: "grapheme" })
  : undefined;

// east asian wide/fullwidth blocks plus the common emoji blocks
const WIDE_RANGES: readonly (readonly [number, number])[] = [
  [0x11_00, 0x11_5F],
  [0x2E_80, 0x30_3E],
  [0x30_41, 0x33_FF],
  [0x34_00, 0x4D_BF],
  [0x4E_00, 0x9F_FF],
  [0xA0_00, 0xA4_CF],
  [0xAC_00, 0xD7_A3],
  [0xF9_00, 0xFA_FF],
  [0xFE_30, 0xFE_4F],
  [0xFF_00, 0xFF_60],
  [0xFF_E0, 0xFF_E6],
  [0x1_F3_00, 0x1_F6_4F],
  [0x1_F6_80, 0x1_F6_FF],
  [0x1_F9_00, 0x1_F9_FF],
  [0x2_00_00, 0x3_FF_FD],
];

export const charWidth = (codePoint: number) => {
  if (ZERO_WIDTH_CODE_POINTS.has(codePoint)) return 0;
  if (codePoint === KEYCAP_CODE_POINT) return 0;
  if (codePoint >= EMOJI_MODIFIER_START && codePoint <= EMOJI_MODIFIER_END) return 0;
  if (codePoint >= 0x3_00 && codePoint <= 0x3_6F) return 0;
  for (const [start, end] of WIDE_RANGES) {
    if (codePoint >= start && codePoint <= end) return 2;
  }
  return 1;
};

export const splitGraphemes = (str: string) => {
  if (!graphemeSegmenter) return Array.from(str);
  return Array.from(graphemeSegmenter.segment(str), (segment) => segment.segment);
};

export const graphemeWidth = (cluster: string) => {
  if (!cluster) return 0;
  if (EMOJI_CLUSTER_REGEX.test(cluster) || KEYCAP_CLUSTER_REGEX.test(cluster)) return 2;
  let width = 0;
  for (const ch of cluster) width += charWidth(ch.codePointAt(0) ?? 0);
  return width;
};

// terminal column width of a string, ignoring ANSI escapes
export const stringWidth = (str: string) => {
  let width = 0;
  for (const cluster of splitGraphemes(stripAnsi(str))) width += graphemeWidth(cluster);
  return width;
};

// truncate a string containing ANSI escapes to maxVisible terminal columns
export const truncateAnsi = (str: string, maxVisible: number, ellipsis = "...") => {
  if (stringWidth(str) <= maxVisible) return str;
  if (maxVisible <= 0) return "";
  if (maxVisible < ellipsis.length) return ellipsis.slice(0, maxVisible);

  const target = maxVisible - ellipsis.length;
  const re = /\u001b\[[\d;]*m/g;
  let out = "";
  let visible = 0;
  let hadAnsi = false;
  let i = 0;

  while (i < str.length) {
    re.lastIndex = i;
    const match = re.exec(str);
    if (match && match.index === i) {
      out += match[0];
      hadAnsi = true;
      i += match[0].length;
      continue;
    }
    const nextEsc = match ? match.index : str.length;
    const [ch = ""] = splitGraphemes(str.slice(i, nextEsc));
    const width = graphemeWidth(ch);
    if (visible + width > target) break;
    out += ch;
    visible += width;
    i += ch.length;
  }

  return out + (hadAnsi ? RESET_COLOR : "") + ellipsis;
};
