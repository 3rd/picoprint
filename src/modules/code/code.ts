import { spawnSync } from "child_process";
import type { BackgroundColorFunction, ForegroundColorFunction } from "@/utils/colors";
import type { LineStyleName } from "@/utils/line-styles";
import { stripAnsi } from "@/utils/ansi";
import { applyBgToSegments, getBackgroundOrIdentity } from "@/utils/background";
import { applyTextWrapping } from "@/utils/string";
import { getTerminalWidth } from "@/utils/terminal";
import { renderAndReturn, write } from "@/utils/writer";
import { box } from "../box";
import { BORDER_WIDTH } from "../box/_shared";
import { dim } from "../colors";
import { getConfig } from "../config";
import { getCurrentContext, type RenderContext } from "../context";

const BAT_COMMAND = "bat";
const BAT_ARGS_BASE = ["--style=plain", "--color=always", "--paging=never"];
const DEFAULT_TERMINAL_WIDTH = 80;
const MARKDOWN_FENCE = "```";
const LINE_NUMBER_SEPARATOR = " │";

export interface CodeOptions {
  language?: string;
  window?: LineStyleName | boolean;
  title?: string;
  titleAlign?: "center" | "left" | "right";
  background?: BackgroundColorFunction;
  borderColor?: ForegroundColorFunction;
  titleColor?: (text: string) => string;
  lineNumbers?: boolean;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  width?: number;
  renderContext?: RenderContext;
}

/** @internal mutable state for bat availability cache */
export const _batState = { available: undefined as boolean | undefined };

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

  // fallback
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

// fallback
const displayFallback = (codeString: string, options: CodeOptions) => {
  const opts = typeof options === "string" ? { language: options } : options || {};
  const language = opts.language;

  if (opts.window) {
    let lines = codeString.split("\n");

    if (opts.lineNumbers) {
      const paddingX = opts.paddingX ?? opts.padding ?? 0;
      lines = addLineNumbers(lines, paddingX);
    }

    const content = lines.join("\n");
    const styleKey =
      typeof opts.window === "string" ? opts.window : (getConfig().defaults?.style ?? "single");

    box(content, {
      style: styleKey,
      borderColor: opts.borderColor,
      background: opts.background,
      title: opts.title,
      titleAlign: opts.titleAlign,
      titleColor: opts.titleColor,
      padding: opts.padding,
      paddingX: opts.paddingX ?? opts.padding ?? 0,
      paddingY: opts.paddingY ?? opts.padding ?? 0,
      width: opts.width,
      renderContext: opts.renderContext,
    });
  } else {
    let lines = codeString.split("\n");

    if (opts.lineNumbers) {
      lines = addLineNumbers(lines);
    }

    if (opts.lineNumbers) {
      for (const line of lines) {
        write(line);
      }
    } else {
      const marker = `${MARKDOWN_FENCE}${language || ""}`;
      write(dim(marker));
      write(codeString);
      write(dim(MARKDOWN_FENCE));
    }
  }
};

// eslint-disable-next-line sonarjs/cognitive-complexity -- heavy code renderer
export const code = (codeString: string, options?: CodeOptions | string) =>
  renderAndReturn(() => {
    const opts = typeof options === "string" ? { language: options } : options || {};
    const ctx = opts.renderContext ?? getCurrentContext();

    // with box
    if (opts.window) {
      const widthForWindow = opts.width ?? ctx.getWidth() ?? getTerminalWidth() ?? DEFAULT_TERMINAL_WIDTH;
      const innerWidthForWindow = Math.max(0, widthForWindow - BORDER_WIDTH);
      const paddingX = opts.paddingX ?? opts.padding ?? 0;
      const baseContentWidth = Math.max(0, innerWidthForWindow - paddingX * 2);

      let targetWidth = baseContentWidth;
      if (opts.lineNumbers) {
        // first pass to get number of wrapped lines without gutter
        const prelim = getHighlightedCode(codeString, opts.language, Math.max(1, baseContentWidth));
        const gutter = getLineNumberGutterWidth(prelim.length, paddingX);
        targetWidth = Math.max(1, baseContentWidth - gutter);
      }

      let lines = getHighlightedCode(codeString, opts.language, Math.max(1, targetWidth));

      // if bat isn't available, manually wrap to target width
      if (!isBatAvailable() && targetWidth > 0) {
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
      const styleKey =
        typeof opts.window === "string" ? opts.window : (getConfig().defaults?.style ?? "single");

      box(content, {
        style: styleKey,
        borderColor: opts.borderColor,
        background: opts.background,
        title: opts.title,
        titleAlign: opts.titleAlign,
        titleColor: opts.titleColor,
        padding: opts.padding,
        paddingX: opts.paddingX ?? opts.padding ?? 0,
        paddingY: opts.paddingY ?? opts.padding ?? 0,
        width: opts.width,
        renderContext: opts.renderContext,
      });
    } else {
      // no box
      if (!codeString || !isBatAvailable()) {
        const bgFn = getBackgroundOrIdentity(opts.background);
        if (opts.background) {
          // background rendering +  padding
          const paddingX = opts.paddingX ?? opts.padding ?? 1;
          const paddingY = opts.paddingY ?? opts.padding ?? 1;
          const ctxWidth =
            opts.renderContext?.getWidth() ??
            getCurrentContext().getWidth() ??
            getTerminalWidth() ??
            DEFAULT_TERMINAL_WIDTH;
          let contentWidth = Math.max(0, ctxWidth - paddingX * 2);

          // reduce content width by gutter if line numbers enabled
          if (opts.lineNumbers) {
            const lineCount = codeString.split("\n").length;
            const gutter = getLineNumberGutterWidth(lineCount, paddingX);
            contentWidth = Math.max(1, contentWidth - gutter);
          }

          // prepare lines and wrap to contentWidth if needed
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

          // top padding lines
          for (let i = 0; i < paddingY; i++) {
            write(bgFn(" ".repeat(ctxWidth)));
          }

          // content lines with left/right padding and background
          for (const line of lines) {
            const strippedLength = stripAnsi(line).length;
            const fillNeeded = Math.max(0, ctxWidth - strippedLength - paddingX * 2);
            const leftPad = bgFn(" ".repeat(paddingX));
            const body = applyBgToSegments(line, bgFn);
            const rightPad = bgFn(" ".repeat(paddingX + fillNeeded));
            write(leftPad + body + rightPad);
          }

          // bottom padding lines
          for (let i = 0; i < paddingY; i++) {
            write(bgFn(" ".repeat(ctxWidth)));
          }
        } else {
          displayFallback(codeString, opts);
        }
        return;
      }

      // wrap to current context width through bat
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
        const ctxWidth =
          opts.renderContext?.getWidth() ??
          getCurrentContext().getWidth() ??
          getTerminalWidth() ??
          DEFAULT_TERMINAL_WIDTH;

        // top padding
        for (let i = 0; i < paddingY; i++) {
          write(bgFn(" ".repeat(ctxWidth)));
        }

        // content with left/right padding
        for (const line of lines) {
          const strippedLength = stripAnsi(line).length;
          const fill = Math.max(0, ctxWidth - strippedLength - paddingX * 2);
          const leftPad = bgFn(" ".repeat(paddingX));
          const body = applyBgToSegments(line, bgFn);
          const rightPad = bgFn(" ".repeat(paddingX + fill));
          write(leftPad + body + rightPad);
        }

        // bottom padding
        for (let i = 0; i < paddingY; i++) {
          write(bgFn(" ".repeat(ctxWidth)));
        }
      } else {
        for (const line of lines) write(line);
      }
    }
  });
