import { drawHorizontalLine } from "@/utils/line-styles";
import { renderAndReturn, write } from "@/utils/writer";
import type { RenderContext } from "../context";
import { colors } from "../colors";
import { getCurrentContext } from "../context";

export interface TraceOptions {
  color?: boolean;
  maxFrames?: number;
  filter?: RegExp;
  header?: "boom" | "none" | "plain";
  skipInternalFrames?: boolean;
  printHeader?: boolean;
  printFooter?: boolean;
  renderContext?: RenderContext;
}

export interface StackOptions {
  maxFrames?: number;
  showFiles?: "hide" | "show";
  skipFrames?: number;
  highlight?: RegExp;
  renderContext?: RenderContext;
}

export interface StackFrame {
  functionName?: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  isNative?: boolean;
  isEval?: boolean;
}

const parseStackFrame = (line: string) => {
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/.exec(line);

  if (!match) return null;

  const [, fnName, file, lineNo, colNo] = match;
  if (!file || !lineNo || !colNo) return null;

  return {
    functionName: fnName?.trim(),
    fileName: file.trim(),
    lineNumber: Number.parseInt(lineNo),
    columnNumber: Number.parseInt(colNo),
    isNative: file.includes("native"),
    isEval: file.includes("eval"),
  };
};

const formatStackFrame = (frame: StackFrame, frameNumber: number, options: StackOptions) => {
  const { showFiles = "show", highlight } = options;
  const lines: string[] = [];

  const frameNum = colors.dim(`#${frameNumber}`);
  const functionName = frame.functionName ? colors.yellow(frame.functionName) : colors.gray("<anonymous>");

  lines.push(`  ${frameNum} ${functionName}`);

  if (showFiles === "show") {
    const location = `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
    const coloredLocation =
      highlight && highlight.test(location) ? colors.red(location) : colors.cyan(location);

    lines.push(`     ${colors.dim("at")} ${coloredLocation}`);
  }

  return lines;
};

const DEFAULT_MAX_FRAMES = 20;
const DEFAULT_STACK_FRAMES = 10;
const getSeparator = (ctx?: RenderContext) =>
  drawHorizontalLine(Math.max(1, (ctx ?? getCurrentContext()).getWidth()));

export const trace = (err: unknown, options: TraceOptions = {}) =>
  renderAndReturn(() => {
    const {
      maxFrames = DEFAULT_MAX_FRAMES,
      filter,
      header = "plain",
      printHeader = true,
      printFooter = true,
      renderContext,
    } = options;

    const message = (() => {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      return String(err);
    })();

    const callErr = new Error(message);
    const stackStr = callErr.stack || `Error: ${message}`;
    const lines = stackStr.split("\n");

    const ctx = renderContext ?? getCurrentContext();
    const indent = " ".repeat(ctx.offset);

    if (printHeader && header !== "none") {
      if (header === "boom") {
        write(indent + colors.red(colors.bold("💥 Error: ")) + colors.red(message));
      } else {
        write(indent + colors.red(`Error: ${message}`));
      }
    }

    // top separator
    write(indent + colors.gray(getSeparator(ctx)));

    // frames
    let frameCount = 0;
    for (let i = 1; i < lines.length && frameCount < maxFrames; i++) {
      const raw = lines[i];
      if (!raw?.trim()) continue;

      const frame = parseStackFrame(raw);
      const isStackLine = raw.trim().startsWith("at ");

      if (!frame && !isStackLine) continue;
      if (filter && !filter.test(raw)) continue;

      frameCount++;
      if (frame) {
        const frameLines = formatStackFrame(frame, frameCount, { showFiles: "show" });
        for (const frameLine of frameLines) write(indent + frameLine);
      } else if (isStackLine) {
        write(indent + colors.dim(`  #${frameCount} ${raw.trim()}`));
      }
    }

    if (frameCount === maxFrames && lines.length > 1 + frameCount) {
      const remaining = lines.length - 1 - frameCount;
      write(indent + colors.dim(`  ... ${remaining} more frames`));
    }

    if (printFooter) write(indent + colors.gray(getSeparator(ctx)));
  });

export const stack = (error?: Error | string, options: StackOptions = {}): string =>
  renderAndReturn(() => {
    const {
      maxFrames = DEFAULT_STACK_FRAMES,
      showFiles = "show",
      skipFrames = 0,
      highlight,
      renderContext,
    } = options;

    const ctx = renderContext ?? getCurrentContext();
    const indent = " ".repeat(ctx.offset);
    const stackStr = (() => {
      if (error instanceof Error) return error.stack || "";
      if (typeof error === "string") return error;
      const err = new Error("error");
      const errStack = err.stack || "";
      const lines = errStack.split("\n");
      lines.splice(1, 1);
      return lines.join("\n");
    })();

    const lines = stackStr.split("\n");
    const errorMessage =
      error instanceof Error || typeof error === "string" ? lines[0] || "Stack Trace" : "Stack Trace";

    write(indent + colors.cyan(colors.bold("📍 ")) + colors.cyan(errorMessage));
    write(indent + colors.gray(getSeparator(ctx)));

    let frameCount = 0;
    let skipped = 0;
    const maxIndex = Math.min(lines.length, maxFrames + skipFrames + 1);

    for (let i = 1; i < maxIndex && frameCount < maxFrames; i++) {
      const line = lines[i];
      if (!line?.trim()) continue;

      const frame = parseStackFrame(line);
      const isStackLine = line.trim().startsWith("at ");

      if (!frame && !isStackLine) continue;

      if (skipped < skipFrames) {
        skipped++;
        continue;
      }

      frameCount++;

      if (frame) {
        const frameLines = formatStackFrame(frame, frameCount, { showFiles, highlight });
        for (const frameLine of frameLines) write(indent + frameLine);
      } else {
        write(indent + colors.dim(`  #${frameCount} ${line.trim()}`));
      }
    }

    if (frameCount === maxFrames && lines.length > maxFrames + 1 + skipFrames) {
      const remaining = lines.length - maxFrames - 1 - skipFrames;
      write(indent + colors.dim(`  ... ${remaining} more frames`));
    }

    write(indent + colors.gray(getSeparator(ctx)));
  });

export const error = (err: unknown, options: TraceOptions = {}) =>
  renderAndReturn(() => {
    const ctx = options.renderContext ?? getCurrentContext();
    const indent = " ".repeat(ctx.offset);

    const message = (() => {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      return String(err);
    })();

    write(indent + colors.red(colors.bold("💥 Error: ")) + colors.red(message));

    if (err instanceof Error) {
      if (err.name && err.name !== "Error") {
        write(indent + colors.dim(`Type: ${err.name}`));
      }
      if (err.cause) {
        write(indent + colors.dim(`Cause: ${String(err.cause)}`));
      }
    }

    trace(message, { ...options, header: "none", printHeader: false });
  });

export const callStack = (options: { renderContext?: RenderContext } = {}) =>
  renderAndReturn(() => {
    const ctx = options.renderContext ?? getCurrentContext();
    const indent = " ".repeat(ctx.offset);
    const err = new Error("trace");
    const stackStr = err.stack || "";
    const lines = stackStr.split("\n");

    lines.splice(0, 2);

    write(indent + colors.cyan(colors.bold("📞 Call Stack")));
    write(indent + colors.gray(getSeparator(ctx)));

    let frameCount = 0;

    for (const frame of lines
      .filter((line) => line?.trim())
      .map(parseStackFrame)
      .filter((f): f is NonNullable<typeof f> => f !== null)) {
      frameCount++;
      const frameLines = formatStackFrame(frame, frameCount, { showFiles: "show" });
      for (const frameLine of frameLines) write(indent + frameLine);
    }

    write(indent + colors.gray(getSeparator(ctx)));
  });
