import { spawnSync } from "child_process";
import { stringWidth } from "../../utils/ansi";
import { applyBgToSegments, getBackgroundOrIdentity } from "../../utils/background";
import {
  assertBackgroundColorOption,
  assertColorFunctionOption,
  assertForegroundColorOption,
  type BackgroundColorOption,
  type ForegroundColorOption,
} from "../../utils/colors";
import { assertLineStyleOption, type LineStyleName } from "../../utils/line-styles";
import {
  ALIGN_VALUES,
  assertBooleanOption,
  assertEnumOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringArgument,
  assertStringOption,
} from "../../utils/options";
import { applyTextWrapping } from "../../utils/string";
import { getTerminalWidth } from "../../utils/terminal";
import { renderAndReturn, write } from "../../utils/writer";
import { box } from "../box";
import { assertBoxWidth, BORDER_WIDTH, clampBoxWidth } from "../box/_shared";
import { dim } from "../colors";
import { getConfig } from "../config";
import { type RenderOptions, resolveRenderContext } from "../context";

const BAT_COMMAND = "bat";
const BAT_ARGS_BASE = ["--style=plain", "--color=always", "--paging=never"];
const DEFAULT_TERMINAL_WIDTH = 80;
const MARKDOWN_FENCE = "```";
const LINE_NUMBER_SEPARATOR = " │";

export interface CodeOptions {
  offset?: RenderOptions["offset"];
  language?: string;
  frame?: LineStyleName | boolean;
  title?: string;
  titleAlign?: "center" | "left" | "right";
  background?: BackgroundColorOption;
  borderColor?: ForegroundColorOption;
  titleColor?: (text: string) => string;
  lineNumbers?: boolean;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  width?: number;
  renderContext?: RenderOptions["renderContext"];
}

const _batState = { available: undefined as boolean | undefined };

const validateCodeOptions = (options: CodeOptions) => {
  assertStringOption(options.language, "language");
  if (
    options.frame !== undefined &&
    typeof options.frame !== "boolean" &&
    typeof options.frame !== "string"
  ) {
    throw new TypeError("picoprint frame must be a boolean or style name");
  }
  if (typeof options.frame === "string") assertLineStyleOption(options.frame, "frame");
  assertStringOption(options.title, "title");
  assertEnumOption(options.titleAlign, "titleAlign", ALIGN_VALUES);
  assertBooleanOption(options.lineNumbers, "lineNumbers");
  assertNonNegativeIntegerOption(options.padding, "padding");
  assertNonNegativeIntegerOption(options.paddingX, "paddingX");
  assertNonNegativeIntegerOption(options.paddingY, "paddingY");
  assertNonNegativeIntegerOption(options.width, "width");
  assertForegroundColorOption(options.borderColor, "borderColor");
  assertBackgroundColorOption(options.background, "background");
  assertColorFunctionOption(options.titleColor, "titleColor");
};

// test seams for the bat availability cache
export const _resetBatCache = () => {
  _batState.available = undefined;
};

export const _setBatAvailable = (value: boolean) => {
  _batState.available = value;
};

const isBatAvailable = () => {
  const config = getConfig();
  if (config.code?.useBat === false) return false;
  if (_batState.available !== undefined) return _batState.available;
  try {
    const result = spawnSync("which", [BAT_COMMAND], {
      encoding: "utf8",
      shell: true,
    });
    _batState.available = result.status === 0;
  } catch {
    _batState.available = false;
  }
  return _batState.available;
};

const getHighlightedCode = (codeString: string, language?: string, targetWidth?: number) => {
  if (!codeString) return [codeString];

  if (isBatAvailable()) {
    try {
      const config = getConfig();
      const args = [...BAT_ARGS_BASE];

      if (language) {
        args.push(`--language=${language}`);
      }
      // wrap
      if (typeof targetWidth === "number" && Number.isFinite(targetWidth) && targetWidth > 0) {
        args.push(`--wrap=character`);
        args.push(`--terminal-width=${Math.floor(targetWidth)}`);
      }

      // theme
      if (config.code?.batTheme) {
        args.push(`--theme=${config.code.batTheme}`);
      }

      // other options
      if (config.code?.batOptions?.length) {
        args.push(...config.code.batOptions);
      }

      const result = spawnSync(BAT_COMMAND, args, {
        input: codeString,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (result.status === 0 && result.stdout) {
        const output = result.stdout.replace(/\n$/, "");
        return output.split("\n");
      }
    } catch (error) {
      // bat highlighting failed, falling back to plain text
      if (getConfig().code?.useBat) {
        console.warn(
          `[picoprint] bat highlighting failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  return codeString.split("\n");
};

const addLineNumbers = (lines: string[], padding = 1) => {
  const maxLineNum = lines.length;
  const numWidth = String(maxLineNum).length;

  return lines.map((line, i) => {
    const lineNum = String(i + 1).padStart(numWidth, " ");
    const paddingStr = " ".repeat(padding);
    return dim(`${lineNum}${LINE_NUMBER_SEPARATOR}`) + paddingStr + line;
  });
};

const getLineNumberGutterWidth = (lineCount: number, paddingAfter: number) => {
  if (lineCount <= 0) return 0;
  const numWidth = String(lineCount).length;
  const sepWidth = LINE_NUMBER_SEPARATOR.length; // leading space + bar
  return numWidth + sepWidth + (paddingAfter >= 0 ? paddingAfter : 0);
};

const getFrameStyle = (opts: CodeOptions): LineStyleName | undefined => {
  if (!opts.frame) return undefined;
  return typeof opts.frame === "string" ? opts.frame : (getConfig().defaults?.style ?? "single");
};

const displayFallback = (codeString: string, options: CodeOptions) => {
  const opts = typeof options === "string" ? { language: options } : options || {};
  const language = opts.language;
  const ctx = resolveRenderContext(opts);
  const indent = " ".repeat(ctx.offset);
  const frameStyle = getFrameStyle(opts);

  if (frameStyle) {
    let lines = codeString.split("\n");

    if (opts.lineNumbers) {
      const paddingX = opts.paddingX ?? opts.padding ?? 0;
      lines = addLineNumbers(lines, paddingX);
    }

    const content = lines.join("\n");
    box(content, {
      style: frameStyle,
      borderColor: opts.borderColor,
      background: opts.background,
      title: opts.title,
      titleAlign: opts.titleAlign,
      titleColor: opts.titleColor,
      padding: opts.padding,
      paddingX: opts.paddingX ?? opts.padding ?? 0,
      paddingY: opts.paddingY ?? opts.padding ?? 0,
      width: opts.width,
      renderContext: ctx,
    });
  } else {
    let lines = codeString.split("\n");

    if (opts.lineNumbers) {
      lines = addLineNumbers(lines);
    }

    if (opts.lineNumbers) {
      for (const line of lines) {
        write(indent + line);
      }
    } else {
      const marker = `${MARKDOWN_FENCE}${language || ""}`;
      write(indent + dim(marker));
      if (ctx.offset === 0) {
        write(codeString);
      } else {
        for (const line of codeString.split("\n")) write(indent + line);
      }
      write(indent + dim(MARKDOWN_FENCE));
    }
  }
};

export const code = (codeString: string, options?: CodeOptions | string) =>
  // eslint-disable-next-line sonarjs/cognitive-complexity -- heavy code renderer
  renderAndReturn(() => {
    assertStringArgument(codeString, "code source");
    if (options !== undefined && typeof options !== "string") {
      assertPlainOptionsObject(options, "code options");
    }
    const opts: CodeOptions = typeof options === "string" ? { language: options } : (options ?? {});
    validateCodeOptions(opts);
    const ctx = resolveRenderContext(opts);
    const indent = " ".repeat(ctx.offset);
    const frameStyle = getFrameStyle(opts);

    if (frameStyle) {
      const paddingX = opts.paddingX ?? opts.padding ?? 0;
      let frameWidth = opts.width ?? ctx.getWidth() ?? getTerminalWidth() ?? DEFAULT_TERMINAL_WIDTH;
      if (opts.width === undefined) frameWidth = clampBoxWidth(frameWidth, paddingX);
      else assertBoxWidth(frameWidth, paddingX);
      const innerFrameWidth = Math.max(0, frameWidth - BORDER_WIDTH);
      const baseContentWidth = Math.max(0, innerFrameWidth - paddingX * 2);

      let targetWidth = baseContentWidth;
      if (opts.lineNumbers) {
        // first pass to get number of wrapped lines without gutter
        const prelim = getHighlightedCode(codeString, opts.language, Math.max(1, baseContentWidth));
        const gutter = getLineNumberGutterWidth(prelim.length, paddingX);
        const minimumWidth = BORDER_WIDTH + paddingX * 2 + gutter + 1;
        if (frameWidth < minimumWidth) {
          throw new RangeError(`picoprint width must be at least ${minimumWidth} when lineNumbers is true`);
        }
        targetWidth = baseContentWidth - gutter;
      }

      let lines = getHighlightedCode(codeString, opts.language, Math.max(1, targetWidth));

      // if bat isn't available, manually wrap to target width
      const shouldWrapManually = !isBatAvailable() && targetWidth > 0;
      if (shouldWrapManually) {
        const wrapped: string[] = [];
        for (const ln of lines) {
          const segs = applyTextWrapping(ln, targetWidth, "");
          wrapped.push(...segs);
        }
        lines = wrapped;
      }

      if (opts.lineNumbers) {
        lines = addLineNumbers(lines, paddingX);
      }

      // draw in box
      const content = lines.join("\n");
      box(content, {
        style: frameStyle,
        borderColor: opts.borderColor,
        background: opts.background,
        title: opts.title,
        titleAlign: opts.titleAlign,
        titleColor: opts.titleColor,
        padding: opts.padding,
        paddingX: opts.paddingX ?? opts.padding ?? 0,
        paddingY: opts.paddingY ?? opts.padding ?? 0,
        width: opts.width,
        renderContext: ctx,
      });
    } else if (codeString && isBatAvailable()) {
      const maxWidth = opts.width ?? ctx.getWidth() ?? getTerminalWidth() ?? DEFAULT_TERMINAL_WIDTH;
      const paddingX = opts.paddingX ?? opts.padding ?? 1;
      const paddingY = opts.paddingY ?? opts.padding ?? 1;
      const baseWidth = Math.max(0, maxWidth - (opts.background ? paddingX * 2 : 0));
      let targetWidth = baseWidth;
      if (opts.lineNumbers) {
        // first pass to estimate wrapped line count without gutter
        const prelim = getHighlightedCode(codeString, opts.language, Math.max(1, baseWidth));
        const gutter = getLineNumberGutterWidth(prelim.length, paddingX);
        targetWidth = Math.max(1, baseWidth - gutter);
      }

      let lines = getHighlightedCode(codeString, opts.language, Math.max(1, targetWidth));

      if (opts.lineNumbers) {
        lines = addLineNumbers(lines, paddingX);
      }

      const bgFn = getBackgroundOrIdentity(opts.background);
      if (opts.background) {
        const ctxWidth = ctx.getWidth() ?? getTerminalWidth() ?? DEFAULT_TERMINAL_WIDTH;

        // top padding
        for (let i = 0; i < paddingY; i++) {
          write(indent + bgFn(" ".repeat(ctxWidth)));
        }

        // content with left/right padding
        for (const line of lines) {
          const strippedLength = stringWidth(line);
          const fill = Math.max(0, ctxWidth - strippedLength - paddingX * 2);
          const leftPad = bgFn(" ".repeat(paddingX));
          const body = applyBgToSegments(line, bgFn);
          const rightPad = bgFn(" ".repeat(paddingX + fill));
          write(indent + leftPad + body + rightPad);
        }

        // bottom padding
        for (let i = 0; i < paddingY; i++) {
          write(indent + bgFn(" ".repeat(ctxWidth)));
        }
      } else {
        for (const line of lines) write(indent + line);
      }
    } else {
      const bgFn = getBackgroundOrIdentity(opts.background);
      if (opts.background) {
        const paddingX = opts.paddingX ?? opts.padding ?? 1;
        const paddingY = opts.paddingY ?? opts.padding ?? 1;
        const ctxWidth = ctx.getWidth() ?? getTerminalWidth() ?? DEFAULT_TERMINAL_WIDTH;
        let contentWidth = Math.max(0, ctxWidth - paddingX * 2);

        if (opts.lineNumbers) {
          const lineCount = codeString.split("\n").length;
          const gutter = getLineNumberGutterWidth(lineCount, paddingX);
          contentWidth = Math.max(1, contentWidth - gutter);
        }

        let lines = codeString.split("\n");
        if (contentWidth > 0) {
          const wrapped: string[] = [];
          for (const ln of lines) {
            const segs = applyTextWrapping(ln, contentWidth, "");
            wrapped.push(...segs);
          }
          lines = wrapped;
        }

        if (opts.lineNumbers) {
          lines = addLineNumbers(lines, paddingX);
        }

        for (let i = 0; i < paddingY; i++) {
          write(indent + bgFn(" ".repeat(ctxWidth)));
        }

        for (const line of lines) {
          const strippedLength = stringWidth(line);
          const fillNeeded = Math.max(0, ctxWidth - strippedLength - paddingX * 2);
          const leftPad = bgFn(" ".repeat(paddingX));
          const body = applyBgToSegments(line, bgFn);
          const rightPad = bgFn(" ".repeat(paddingX + fillNeeded));
          write(indent + leftPad + body + rightPad);
        }

        for (let i = 0; i < paddingY; i++) {
          write(indent + bgFn(" ".repeat(ctxWidth)));
        }
      } else {
        displayFallback(codeString, opts);
      }
    }
  });
