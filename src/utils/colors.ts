export type ColorFunction = (str: number | string) => string;
export type ForegroundColorFunction = ColorFunction & { readonly __kind: "fg" };
export type BackgroundColorFunction = ColorFunction & { readonly __kind: "bg" };

export const isColorSupported = (): boolean => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  if (process.stdout?.isTTY && process.env.TERM !== "dumb") return true;
  return false;
};

const replaceClose = (string: string, close: string, replace: string, index: number): string => {
  let result = "";
  let cursor = 0;
  let currentIndex = index;

  do {
    result += string.slice(cursor, currentIndex) + replace;
    cursor = currentIndex + close.length;
    currentIndex = string.indexOf(close, cursor);
    // eslint-disable-next-line no-bitwise
  } while (~currentIndex);

  return result + string.slice(Math.max(0, cursor));
};

const formatter = (open: string, close: string, replace: string = open) => {
  return (input: number | string): string => {
    const string = `${input}`;
    const index = string.indexOf(close, open.length);
    // eslint-disable-next-line no-bitwise
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
};

export const createColors = (enabled = isColorSupported()) => {
  const wrap = (open: string, close: string, replace?: string): ColorFunction =>
    enabled ? formatter(open, close, replace) : String;
  const brandFg = (fn: ColorFunction): ForegroundColorFunction =>
    Object.assign(fn, { __kind: "fg" as const });
  const brandBg = (fn: ColorFunction): BackgroundColorFunction =>
    Object.assign(fn, { __kind: "bg" as const });
  return {
    // modifiers
    reset: brandFg(wrap("\u001b[0m", "\u001b[0m")),
    bold: brandFg(wrap("\u001b[1m", "\u001b[22m", "\u001b[22m\u001b[1m")),
    dim: brandFg(wrap("\u001b[2m", "\u001b[22m", "\u001b[22m\u001b[2m")),
    italic: brandFg(wrap("\u001b[3m", "\u001b[23m")),
    underline: brandFg(wrap("\u001b[4m", "\u001b[24m")),
    inverse: brandFg(wrap("\u001b[7m", "\u001b[27m")),
    strikethrough: brandFg(wrap("\u001b[9m", "\u001b[29m")),

    // regular
    black: brandFg(wrap("\u001b[30m", "\u001b[39m")),
    red: brandFg(wrap("\u001b[31m", "\u001b[39m")),
    green: brandFg(wrap("\u001b[32m", "\u001b[39m")),
    yellow: brandFg(wrap("\u001b[33m", "\u001b[39m")),
    blue: brandFg(wrap("\u001b[34m", "\u001b[39m")),
    magenta: brandFg(wrap("\u001b[35m", "\u001b[39m")),
    cyan: brandFg(wrap("\u001b[36m", "\u001b[39m")),
    white: brandFg(wrap("\u001b[37m", "\u001b[39m")),
    gray: brandFg(wrap("\u001b[90m", "\u001b[39m")),
    grey: brandFg(wrap("\u001b[90m", "\u001b[39m")),

    // bright
    blackBright: brandFg(wrap("\u001b[90m", "\u001b[39m")),
    redBright: brandFg(wrap("\u001b[91m", "\u001b[39m")),
    greenBright: brandFg(wrap("\u001b[92m", "\u001b[39m")),
    yellowBright: brandFg(wrap("\u001b[93m", "\u001b[39m")),
    blueBright: brandFg(wrap("\u001b[94m", "\u001b[39m")),
    magentaBright: brandFg(wrap("\u001b[95m", "\u001b[39m")),
    cyanBright: brandFg(wrap("\u001b[96m", "\u001b[39m")),
    whiteBright: brandFg(wrap("\u001b[97m", "\u001b[39m")),

    // background
    bgBlack: brandBg(wrap("\u001b[40m", "\u001b[49m")),
    bgRed: brandBg(wrap("\u001b[41m", "\u001b[49m")),
    bgGreen: brandBg(wrap("\u001b[42m", "\u001b[49m")),
    bgYellow: brandBg(wrap("\u001b[43m", "\u001b[49m")),
    bgBlue: brandBg(wrap("\u001b[44m", "\u001b[49m")),
    bgMagenta: brandBg(wrap("\u001b[45m", "\u001b[49m")),
    bgCyan: brandBg(wrap("\u001b[46m", "\u001b[49m")),
    bgWhite: brandBg(wrap("\u001b[47m", "\u001b[49m")),
    bgGray: brandBg(wrap("\u001b[100m", "\u001b[49m")),
    bgGrey: brandBg(wrap("\u001b[100m", "\u001b[49m")),

    // bright background
    bgBlackBright: brandBg(wrap("\u001b[100m", "\u001b[49m")),
    bgRedBright: brandBg(wrap("\u001b[101m", "\u001b[49m")),
    bgGreenBright: brandBg(wrap("\u001b[102m", "\u001b[49m")),
    bgYellowBright: brandBg(wrap("\u001b[103m", "\u001b[49m")),
    bgBlueBright: brandBg(wrap("\u001b[104m", "\u001b[49m")),
    bgMagentaBright: brandBg(wrap("\u001b[105m", "\u001b[49m")),
    bgCyanBright: brandBg(wrap("\u001b[106m", "\u001b[49m")),
    bgWhiteBright: brandBg(wrap("\u001b[107m", "\u001b[49m")),
  };
};

export const colors = createColors();

export const color256 = (code: number): ForegroundColorFunction => {
  if (code < 0 || code > 255) {
    throw new Error(`Color code must be between 0 and 255, got ${code}`);
  }
  const enabled = isColorSupported();
  return (
    enabled ?
      formatter(`\u001b[38;5;${code}m`, "\u001b[39m")
    : (String as unknown as ColorFunction)) as ForegroundColorFunction;
};

export const bgColor256 = (code: number): BackgroundColorFunction => {
  if (code < 0 || code > 255) {
    throw new Error(`Color code must be between 0 and 255, got ${code}`);
  }
  const enabled = isColorSupported();
  return (
    enabled ?
      formatter(`\u001b[48;5;${code}m`, "\u001b[49m")
    : (String as unknown as ColorFunction)) as BackgroundColorFunction;
};

export const rgb = (r: number, g: number, b: number): ForegroundColorFunction => {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error(`RGB values must be between 0 and 255`);
  }
  const enabled = isColorSupported();
  return (
    enabled ?
      formatter(`\u001b[38;2;${r};${g};${b}m`, "\u001b[39m")
    : (String as unknown as ColorFunction)) as ForegroundColorFunction;
};

export const bgRgb = (r: number, g: number, b: number): BackgroundColorFunction => {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error(`RGB values must be between 0 and 255`);
  }
  const enabled = isColorSupported();
  return (
    enabled ?
      formatter(`\u001b[48;2;${r};${g};${b}m`, "\u001b[49m")
    : (String as unknown as ColorFunction)) as BackgroundColorFunction;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null;
  }
  return {
    r: Number.parseInt(result[1], 16),
    g: Number.parseInt(result[2], 16),
    b: Number.parseInt(result[3], 16),
  };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  // eslint-disable-next-line no-bitwise
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const hex = (hexColor: string): ForegroundColorFunction => {
  const rgbVal = hexToRgb(hexColor);
  if (!rgbVal) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }
  return rgb(rgbVal.r, rgbVal.g, rgbVal.b);
};

export const bgHex = (hexColor: string): BackgroundColorFunction => {
  const rgbVal = hexToRgb(hexColor);
  if (!rgbVal) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }
  return bgRgb(rgbVal.r, rgbVal.g, rgbVal.b);
};

export const getTypeColor = (type: string): ColorFunction => {
  switch (type) {
    case "string": {
      return colors.green;
    }
    case "number":
    case "bigint": {
      return colors.yellow;
    }
    case "boolean": {
      return colors.magenta;
    }
    case "null":
    case "undefined": {
      return colors.gray;
    }
    case "symbol": {
      return colors.magenta;
    }
    case "function": {
      return colors.blueBright;
    }
    case "date": {
      return colors.cyan;
    }
    case "regexp": {
      return colors.magenta;
    }
    case "error": {
      return colors.red;
    }
    case "array": {
      return colors.cyan;
    }
    case "object": {
      return colors.cyan;
    }
    default: {
      return colors.reset;
    }
  }
};

export const rainbow = (text: string): string => {
  const enabled = isColorSupported();
  const colorFuncs = enabled ? createColors(true) : createColors(false);
  const rainbowColors = [
    colorFuncs.red,
    colorFuncs.yellow,
    colorFuncs.green,
    colorFuncs.cyan,
    colorFuncs.blue,
    colorFuncs.magenta,
  ];

  return text
    .split("")
    .map((char, i) => {
      if (char === " ") return char;
      const color = rainbowColors[i % rainbowColors.length];
      return color ? color(char) : char;
    })
    .join("");
};

const interpolateRgb = (
  start: { r: number; g: number; b: number },
  end: { r: number; g: number; b: number },
  ratio: number,
): { r: number; g: number; b: number } => {
  return {
    r: Math.round(start.r + (end.r - start.r) * ratio),
    g: Math.round(start.g + (end.g - start.g) * ratio),
    b: Math.round(start.b + (end.b - start.b) * ratio),
  };
};

export const gradientRgb = (
  text: string,
  startRgb: { r: number; g: number; b: number },
  endRgb: { r: number; g: number; b: number },
): string => {
  const enabled = isColorSupported();
  if (!enabled) return text;

  const length = text.length;
  if (length === 0) return "";
  if (length === 1) return rgb(startRgb.r, startRgb.g, startRgb.b)(text);

  return text
    .split("")
    .map((char, i) => {
      if (char === " " || char === "\t" || char === "\n") return char;

      const ratio = i / (length - 1);
      const interpolated = interpolateRgb(startRgb, endRgb, ratio);
      return rgb(interpolated.r, interpolated.g, interpolated.b)(char);
    })
    .join("");
};

export const gradientHex = (text: string, startHex: string, endHex: string): string => {
  const startRgb = hexToRgb(startHex);
  const endRgb = hexToRgb(endHex);

  if (!startRgb) {
    throw new Error(`Invalid start hex color: ${startHex}`);
  }
  if (!endRgb) {
    throw new Error(`Invalid end hex color: ${endHex}`);
  }

  return gradientRgb(text, startRgb, endRgb);
};

export const gradient = (text: string, startColor: ColorFunction, endColor: ColorFunction): string => {
  const enabled = isColorSupported();
  if (!enabled) return text;

  const defaultColors: Record<string, { r: number; g: number; b: number }> = {
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    cyan: { r: 0, g: 255, b: 255 },
    white: { r: 255, g: 255, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    blackBright: { r: 128, g: 128, b: 128 },
    redBright: { r: 255, g: 85, b: 85 },
    greenBright: { r: 85, g: 255, b: 85 },
    yellowBright: { r: 255, g: 255, b: 85 },
    blueBright: { r: 85, g: 85, b: 255 },
    magentaBright: { r: 255, g: 85, b: 255 },
    cyanBright: { r: 85, g: 255, b: 255 },
    whiteBright: { r: 255, g: 255, b: 255 },
  };

  const getColorRgb = (fn: ColorFunction): { r: number; g: number; b: number } | null => {
    const testStr = "test";
    const result = fn(testStr);

    // eslint-disable-next-line no-control-regex
    const rgbMatch = /\u001b\[38;2;(\d+);(\d+);(\d+)m/.exec(result);
    if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
      return {
        r: Number.parseInt(rgbMatch[1]),
        g: Number.parseInt(rgbMatch[2]),
        b: Number.parseInt(rgbMatch[3]),
      };
    }

    const colorCodes: Record<string, string> = {
      "\u001b[30m": "black",
      "\u001b[31m": "red",
      "\u001b[32m": "green",
      "\u001b[33m": "yellow",
      "\u001b[34m": "blue",
      "\u001b[35m": "magenta",
      "\u001b[36m": "cyan",
      "\u001b[37m": "white",
      "\u001b[90m": "gray",
      "\u001b[91m": "redBright",
      "\u001b[92m": "greenBright",
      "\u001b[93m": "yellowBright",
      "\u001b[94m": "blueBright",
      "\u001b[95m": "magentaBright",
      "\u001b[96m": "cyanBright",
      "\u001b[97m": "whiteBright",
    };

    for (const [code, name] of Object.entries(colorCodes)) {
      if (result.startsWith(code)) {
        return defaultColors[name] || null;
      }
    }

    return null;
  };

  const startRgb = getColorRgb(startColor);
  const endRgb = getColorRgb(endColor);

  if (!startRgb || !endRgb) {
    if (text.length === 0) return "";
    return startColor(text);
  }

  return gradientRgb(text, startRgb, endRgb);
};

export const createColorPalette = (baseColor: string, count = 5): string[] => {
  const palette: string[] = [];
  const rgbVal = hexToRgb(baseColor);

  if (!rgbVal) return [baseColor];

  for (let i = 0; i < count; i++) {
    const factor = (i + 1) / count;
    const r = Math.round(rgbVal.r + (255 - rgbVal.r) * factor);
    const g = Math.round(rgbVal.g + (255 - rgbVal.g) * factor);
    const b = Math.round(rgbVal.b + (255 - rgbVal.b) * factor);
    palette.push(rgbToHex(r, g, b));
  }

  return palette;
};
