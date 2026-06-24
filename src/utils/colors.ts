export type ColorFunction = (str: number | string) => string;
export type ForegroundColorFunction = ColorFunction & { readonly __kind: "fg" };
export type BackgroundColorFunction = ColorFunction & { readonly __kind: "bg" };
export type ColorOptionFunction = (str: string) => string;
export type ForegroundColorOption = ColorOptionFunction & { readonly __kind?: "fg" };
export type BackgroundColorOption = ColorOptionFunction & { readonly __kind?: "bg" };
type ColorKind = "bg" | "fg";
type RgbValue = { r: number; g: number; b: number };

export const isColorSupported = () => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  if (process.stdout?.isTTY && process.env.TERM !== "dumb") return true;
  return false;
};

const replaceClose = (string: string, close: string, replace: string, index: number) => {
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
  return (input: number | string) => {
    const string = `${input}`;
    const index = string.indexOf(close, open.length);
    // eslint-disable-next-line no-bitwise
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
};

const disabledColor = (): ColorFunction => String;

const brandFg = (fn: ColorFunction): ForegroundColorFunction => Object.assign(fn, { __kind: "fg" as const });

const brandBg = (fn: ColorFunction): BackgroundColorFunction => Object.assign(fn, { __kind: "bg" as const });

const assertByteChannel = (value: unknown, optionName: string) => {
  if (typeof value !== "number") {
    throw new TypeError(`picoprint ${optionName} must be a number`);
  }
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`picoprint ${optionName} must be an integer from 0 to 255, got ${value}`);
  }
  return value;
};

const assertStringValue = (value: unknown, optionName: string) => {
  if (typeof value !== "string") {
    throw new TypeError(`picoprint ${optionName} must be a string`);
  }
  return value;
};

const assertColorFunction = (value: unknown, optionName: string): ColorFunction => {
  if (typeof value !== "function") {
    throw new TypeError(`picoprint ${optionName} must be a function`);
  }
  return value as ColorFunction;
};

const assertPaletteCount = (value: unknown) => {
  if (typeof value !== "number") {
    throw new TypeError("picoprint palette count must be a number");
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`picoprint palette count must be a non-negative integer, got ${value}`);
  }
  return value;
};

const assertRgbValue = (value: unknown, optionName: string): RgbValue => {
  if (!value || typeof value !== "object") {
    throw new TypeError(`picoprint ${optionName} must be an object with r, g, and b`);
  }
  const rgbValue = value as Partial<RgbValue>;
  return {
    r: assertByteChannel(rgbValue.r, `${optionName}.r`),
    g: assertByteChannel(rgbValue.g, `${optionName}.g`),
    b: assertByteChannel(rgbValue.b, `${optionName}.b`),
  };
};

export const getColorKind = (value: unknown): ColorKind | undefined => {
  if (typeof value !== "function") return undefined;
  return (value as { readonly __kind?: ColorKind }).__kind;
};

const assertFunctionOption = (value: unknown, optionName: string) => {
  if (value === undefined) return false;
  if (typeof value !== "function") throw new TypeError(`picoprint ${optionName} must be a function`);
  return true;
};

export const assertColorFunctionOption = (value: unknown, optionName: string) => {
  assertFunctionOption(value, optionName);
};

export const assertForegroundColorOption = (value: unknown, optionName: string) => {
  if (!assertFunctionOption(value, optionName)) return;
  if (getColorKind(value) === "bg") {
    throw new TypeError(
      `picoprint ${optionName} must be a foreground color function, got a background color function`,
    );
  }
};

export const assertBackgroundColorOption = (value: unknown, optionName: string) => {
  if (!assertFunctionOption(value, optionName)) return;
  if (getColorKind(value) === "fg") {
    throw new TypeError(
      `picoprint ${optionName} must be a background color function, got a foreground color function`,
    );
  }
};

const resolveColorSupport = (enabled?: boolean) => enabled ?? isColorSupported();

const supportedFormatter = (
  open: string,
  close: string,
  replace?: string,
  enabled?: boolean,
): ColorFunction => {
  const color = formatter(open, close, replace);
  const plain = disabledColor();
  return (input) => (resolveColorSupport(enabled) ? color(input) : plain(input));
};

export const createColors = (enabled?: boolean) => {
  const wrap = (open: string, close: string, replace?: string): ColorFunction =>
    supportedFormatter(open, close, replace, enabled);
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
  const colorCode = assertByteChannel(code, "color256 code");
  return brandFg(supportedFormatter(`\u001b[38;5;${colorCode}m`, "\u001b[39m"));
};

export const bgColor256 = (code: number): BackgroundColorFunction => {
  const colorCode = assertByteChannel(code, "bgColor256 code");
  return brandBg(supportedFormatter(`\u001b[48;5;${colorCode}m`, "\u001b[49m"));
};

export const rgb = (r: number, g: number, b: number): ForegroundColorFunction => {
  const red = assertByteChannel(r, "rgb r");
  const green = assertByteChannel(g, "rgb g");
  const blue = assertByteChannel(b, "rgb b");
  return brandFg(supportedFormatter(`\u001b[38;2;${red};${green};${blue}m`, "\u001b[39m"));
};

export const bgRgb = (r: number, g: number, b: number): BackgroundColorFunction => {
  const red = assertByteChannel(r, "bgRgb r");
  const green = assertByteChannel(g, "bgRgb g");
  const blue = assertByteChannel(b, "bgRgb b");
  return brandBg(supportedFormatter(`\u001b[48;2;${red};${green};${blue}m`, "\u001b[49m"));
};

export const hexToRgb = (hex: string) => {
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

const assertHexColor = (value: unknown, optionName: string) => {
  const hexColor = assertStringValue(value, optionName);
  const rgbVal = hexToRgb(hexColor);
  if (!rgbVal) {
    throw new TypeError(`picoprint ${optionName} must be a 6-digit hex color, got ${hexColor}`);
  }
  return rgbVal;
};

export const rgbToHex = (r: number, g: number, b: number) => {
  // eslint-disable-next-line no-bitwise
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const hex = (hexColor: string): ForegroundColorFunction => {
  const rgbVal = assertHexColor(hexColor, "hex color");
  return rgb(rgbVal.r, rgbVal.g, rgbVal.b);
};

export const bgHex = (hexColor: string): BackgroundColorFunction => {
  const rgbVal = assertHexColor(hexColor, "bgHex color");
  return bgRgb(rgbVal.r, rgbVal.g, rgbVal.b);
};

// neutral key color shared by pp, table, and stream formatters
export const keyColor: ForegroundColorFunction = colors.white;

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

export const rainbow = (text: string) => {
  const value = assertStringValue(text, "rainbow text");
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

  return value
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
) => {
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
) => {
  const value = assertStringValue(text, "gradientRgb text");
  const start = assertRgbValue(startRgb, "gradientRgb start");
  const end = assertRgbValue(endRgb, "gradientRgb end");
  const enabled = isColorSupported();
  if (!enabled) return value;

  const length = value.length;
  if (length === 0) return "";
  if (length === 1) return rgb(start.r, start.g, start.b)(value);

  return value
    .split("")
    .map((char, i) => {
      if (char === " " || char === "\t" || char === "\n") return char;

      const ratio = i / (length - 1);
      const interpolated = interpolateRgb(start, end, ratio);
      return rgb(interpolated.r, interpolated.g, interpolated.b)(char);
    })
    .join("");
};

export const gradientHex = (text: string, startHex: string, endHex: string) => {
  const value = assertStringValue(text, "gradientHex text");
  const startRgb = assertHexColor(startHex, "gradientHex start");
  const endRgb = assertHexColor(endHex, "gradientHex end");

  return gradientRgb(value, startRgb, endRgb);
};

export const gradient = (text: string, startColor: ColorOptionFunction, endColor: ColorOptionFunction) => {
  const value = assertStringValue(text, "gradient text");
  const startFn = assertColorFunction(startColor, "gradient start");
  const endFn = assertColorFunction(endColor, "gradient end");
  const enabled = isColorSupported();
  if (!enabled) return value;

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

  const getColorRgb = (fn: ColorFunction) => {
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

  const startRgb = getColorRgb(startFn);
  const endRgb = getColorRgb(endFn);

  if (!startRgb || !endRgb) {
    if (value.length === 0) return "";
    return startFn(value);
  }

  return gradientRgb(value, startRgb, endRgb);
};

export const createColorPalette = (baseColor: string, count = 5) => {
  const rgbVal = assertHexColor(baseColor, "palette color");
  const colorCount = assertPaletteCount(count);
  const palette: string[] = [];

  for (let i = 0; i < colorCount; i++) {
    const factor = (i + 1) / colorCount;
    const r = Math.round(rgbVal.r + (255 - rgbVal.r) * factor);
    const g = Math.round(rgbVal.g + (255 - rgbVal.g) * factor);
    const b = Math.round(rgbVal.b + (255 - rgbVal.b) * factor);
    palette.push(rgbToHex(r, g, b));
  }

  return palette;
};
