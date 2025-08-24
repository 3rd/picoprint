import type { ForegroundColorFunction } from "../utils/colors";
import {
  bgColor256,
  bgHex,
  bgRgb,
  color256,
  colors,
  createColorPalette,
  getTypeColor,
  gradient,
  gradientHex,
  gradientRgb,
  hex,
  isColorSupported,
  rainbow,
  rgb,
} from "../utils/colors";

export type ForegroundColorName = {
  [K in keyof typeof colors]: (typeof colors)[K] extends ForegroundColorFunction ? K : never;
}[keyof typeof colors];

// modifiers
export const reset = colors.reset;
export const bold = colors.bold;
export const dim = colors.dim;
export const italic = colors.italic;
export const underline = colors.underline;
export const inverse = colors.inverse;
export const strikethrough = colors.strikethrough;

// regular
export const black = colors.black;
export const red = colors.red;
export const green = colors.green;
export const yellow = colors.yellow;
export const blue = colors.blue;
export const magenta = colors.magenta;
export const cyan = colors.cyan;
export const white = colors.white;
export const gray = colors.gray;
export const grey = colors.grey;

// bright
export const blackBright = colors.blackBright;
export const redBright = colors.redBright;
export const greenBright = colors.greenBright;
export const yellowBright = colors.yellowBright;
export const blueBright = colors.blueBright;
export const magentaBright = colors.magentaBright;
export const cyanBright = colors.cyanBright;
export const whiteBright = colors.whiteBright;

// background
export const bgBlack = colors.bgBlack;
export const bgRed = colors.bgRed;
export const bgGreen = colors.bgGreen;
export const bgYellow = colors.bgYellow;
export const bgBlue = colors.bgBlue;
export const bgMagenta = colors.bgMagenta;
export const bgCyan = colors.bgCyan;
export const bgWhite = colors.bgWhite;
export const bgGray = colors.bgGray;
export const bgGrey = colors.bgGrey;

// bright background
export const bgBlackBright = colors.bgBlackBright;
export const bgRedBright = colors.bgRedBright;
export const bgGreenBright = colors.bgGreenBright;
export const bgYellowBright = colors.bgYellowBright;
export const bgBlueBright = colors.bgBlueBright;
export const bgMagentaBright = colors.bgMagentaBright;
export const bgCyanBright = colors.bgCyanBright;
export const bgWhiteBright = colors.bgWhiteBright;

export { createColorPalette as palette };
export { getTypeColor as typeColor };
export {
  bgColor256,
  bgHex,
  bgRgb,
  color256,
  colors,
  gradient,
  gradientHex,
  gradientRgb,
  hex,
  isColorSupported,
  rainbow,
  rgb,
};

// key color for formatters
export const keyColor = colors.white;
