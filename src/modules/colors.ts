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
import { toInlineLogString } from "../utils/log-format";
import { getCurrentContext } from "./context";

export type ForegroundColorName = {
  [K in keyof typeof colors]: (typeof colors)[K] extends ForegroundColorFunction ? K : never;
}[keyof typeof colors];

type Kind = "bg" | "fg";
type BaseFn = (s: number | string) => string;

type Chainable<K extends Kind> = ((s: number | string) => string) & {
  [P in keyof typeof colors]: Chainable<K>;
} & {
  readonly __kind: K;
  log: (...args: unknown[]) => string;
};

const isColorKey = (key: PropertyKey): key is keyof typeof colors => typeof key === "string" && key in colors;

const asKind = (fn: unknown): Kind | undefined => {
  if (!fn || typeof fn !== "function") return undefined;
  const k = (fn as { __kind?: Kind }).__kind;
  return k;
};

const makeChainFn = <K extends Kind>(chain: BaseFn[], kind: K): Chainable<K> => {
  const apply = ((input: number | string) => {
    let out = String(input);
    for (const fn of chain) out = fn(out);
    return out;
  }) as Chainable<K>;

  Object.defineProperty(apply, "__kind", { value: kind, enumerable: false });

  return new Proxy(apply, {
    get(target, prop, receiver) {
      if (prop === "__kind") return kind;
      if (prop === "log") {
        return (...args: unknown[]) => {
          const ctx = getCurrentContext();
          const indent = " ".repeat(ctx.offset);
          const pieces = args.map((a) => {
            const text = toInlineLogString(a);
            // style each line
            const styled = text
              .split(/\r?\n/)
              .map((line) => target(line))
              .join("\n");
            return styled;
          });
          const combined = pieces.join(" ");
          const lines = combined.split(/\r?\n/);
          for (const line of lines) console.log(indent + line);
          return combined;
        };
      }
      if (prop in target) return Reflect.get(target, prop, receiver);

      if (isColorKey(prop)) {
        const next = colors[prop];
        if (typeof next === "function" && asKind(next)) {
          return makeChainFn([...chain, next], kind);
        }
      }
      return undefined;
    },
  });
};

const chain = <K extends Kind>(fn: BaseFn & { __kind: K }): Chainable<K> => makeChainFn([fn], fn.__kind);

// modifiers
export const reset = chain(colors.reset);
export const bold = chain(colors.bold);
export const dim = chain(colors.dim);
export const italic = chain(colors.italic);
export const underline = chain(colors.underline);
export const inverse = chain(colors.inverse);
export const strikethrough = chain(colors.strikethrough);

// regular
export const black = chain(colors.black);
export const red = chain(colors.red);
export const green = chain(colors.green);
export const yellow = chain(colors.yellow);
export const blue = chain(colors.blue);
export const magenta = chain(colors.magenta);
export const cyan = chain(colors.cyan);
export const white = chain(colors.white);
export const gray = chain(colors.gray);
export const grey = chain(colors.grey);

// bright
export const blackBright = chain(colors.blackBright);
export const redBright = chain(colors.redBright);
export const greenBright = chain(colors.greenBright);
export const yellowBright = chain(colors.yellowBright);
export const blueBright = chain(colors.blueBright);
export const magentaBright = chain(colors.magentaBright);
export const cyanBright = chain(colors.cyanBright);
export const whiteBright = chain(colors.whiteBright);

// background
export const bgBlack = chain(colors.bgBlack);
export const bgRed = chain(colors.bgRed);
export const bgGreen = chain(colors.bgGreen);
export const bgYellow = chain(colors.bgYellow);
export const bgBlue = chain(colors.bgBlue);
export const bgMagenta = chain(colors.bgMagenta);
export const bgCyan = chain(colors.bgCyan);
export const bgWhite = chain(colors.bgWhite);
export const bgGray = chain(colors.bgGray);
export const bgGrey = chain(colors.bgGrey);

// bright background
export const bgBlackBright = chain(colors.bgBlackBright);
export const bgRedBright = chain(colors.bgRedBright);
export const bgGreenBright = chain(colors.bgGreenBright);
export const bgYellowBright = chain(colors.bgYellowBright);
export const bgBlueBright = chain(colors.bgBlueBright);
export const bgMagentaBright = chain(colors.bgMagentaBright);
export const bgCyanBright = chain(colors.bgCyanBright);
export const bgWhiteBright = chain(colors.bgWhiteBright);

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
export const keyColor: ForegroundColorFunction = colors.white;
