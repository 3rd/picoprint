import type { RenderContext, RenderOptions } from "../context";
import { colors } from "../../utils/colors";
import { drawHorizontalLine } from "../../utils/line-styles";
import {
  assertBooleanOption,
  assertEnumOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertRegExpOption,
  isOptionsObject,
  isPlainRecord,
} from "../../utils/options";
import { renderAndReturn, write } from "../../utils/writer";
import { getCurrentContext, resolveRenderContext } from "../context";

export interface TraceOptions extends RenderOptions {
  maxFrames?: number;
  filter?: RegExp;
  header?: "none" | "plain";
  footer?: boolean;
}

export interface StackOptions extends RenderOptions {
  maxFrames?: number;
  showFiles?: "hide" | "show";
  skipFrames?: number;
  highlight?: RegExp;
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

const testRegExp = (regex: RegExp, value: string) => {
  const regexForTest = regex;
  const previousLastIndex = regexForTest.lastIndex;
  regexForTest.lastIndex = 0;

  try {
    return regexForTest.test(value);
  } finally {
    regexForTest.lastIndex = previousLastIndex;
  }
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
      highlight && testRegExp(highlight, location) ? colors.red(location) : colors.cyan(location);

    lines.push(`     ${colors.dim("at")} ${coloredLocation}`);
  }

  return lines;
};

const DEFAULT_MAX_FRAMES = 20;
const DEFAULT_STACK_FRAMES = 10;
const TRACE_HEADER_VALUES = ["none", "plain"] as const;
const STACK_SHOW_FILES_VALUES = ["hide", "show"] as const;
const getSeparator = (ctx?: RenderContext) =>
  drawHorizontalLine(Math.max(1, (ctx ?? getCurrentContext()).getWidth()));

const validateTraceOptions = (options: TraceOptions) => {
  assertPlainOptionsObject(options, "trace options");
  assertNonNegativeIntegerOption(options.maxFrames, "maxFrames");
  assertRegExpOption(options.filter, "filter");
  assertEnumOption(options.header, "header", TRACE_HEADER_VALUES);
  assertBooleanOption(options.footer, "footer");
};

const assertStackArgument = (value: unknown) => {
  if (value === undefined || value instanceof Error || typeof value === "string" || isPlainRecord(value)) {
    return;
  }
  throw new TypeError("picoprint trace.stack argument must be an Error, stack string, or options object");
};

const validateStackOptions = (options: StackOptions, optionName = "trace.stack options") => {
  assertPlainOptionsObject(options, optionName);
  assertNonNegativeIntegerOption(options.maxFrames, "maxFrames");
  assertEnumOption(options.showFiles, "showFiles", STACK_SHOW_FILES_VALUES);
  assertNonNegativeIntegerOption(options.skipFrames, "skipFrames");
  assertRegExpOption(options.highlight, "highlight");
};

const getTraceStack = (err: unknown, message: string) => {
  if (err instanceof Error && err.stack) return err.stack;
  const callErr = new Error(message);
  return callErr.stack || `Error: ${message}`;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export const trace = (err: unknown, options: TraceOptions = {}) =>
  renderAndReturn(() => {
    validateTraceOptions(options);
    const { maxFrames = DEFAULT_MAX_FRAMES, filter, header = "plain", footer = true } = options;

    const message = (() => {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      return String(err);
    })();

    const stackStr = getTraceStack(err, message);
    const lines = stackStr.split("\n");

    const ctx = resolveRenderContext(options);
    const indent = " ".repeat(ctx.offset);

    if (header !== "none") {
      write(indent + colors.red(`Error: ${message}`));
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
      if (filter && !testRegExp(filter, raw)) continue;

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

    if (footer) write(indent + colors.gray(getSeparator(ctx)));
  });

export function stack(options?: StackOptions): string;
export function stack(error?: Error | string, options?: StackOptions): string;
export function stack(errorOrOptions?: Error | StackOptions | string, options: StackOptions = {}): string {
  assertStackArgument(errorOrOptions);
  const isOptionsOnly = isOptionsObject(errorOrOptions) && !(errorOrOptions instanceof Error);
  const error = isOptionsOnly ? undefined : errorOrOptions;
  const opts: StackOptions = isOptionsOnly ? (errorOrOptions as StackOptions) : options;

  return renderAndReturn(() => {
    validateStackOptions(opts);
    const { maxFrames = DEFAULT_STACK_FRAMES, showFiles = "show", skipFrames = 0, highlight } = opts;

    const ctx = resolveRenderContext(opts);
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

    write(indent + colors.cyan(colors.bold(errorMessage)));
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
}

export const error = (err: unknown, options: TraceOptions = {}) =>
  renderAndReturn(() => {
    validateTraceOptions(options);
    const ctx = resolveRenderContext(options);
    const indent = " ".repeat(ctx.offset);

    const message = (() => {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      return String(err);
    })();

    write(indent + colors.red(colors.bold("Error: ")) + colors.red(message));

    if (err instanceof Error) {
      if (err.name && err.name !== "Error") {
        write(indent + colors.dim(`Type: ${err.name}`));
      }
      if ("cause" in err && err.cause !== undefined) {
        write(indent + colors.dim(`Cause: ${String(err.cause)}`));
      }
    }

    trace(err, { ...options, header: "none" });
  });

export const callStack = (options: StackOptions = {}) =>
  renderAndReturn(() => {
    validateStackOptions(options, "trace.callStack options");
    const ctx = resolveRenderContext(options);
    const indent = " ".repeat(ctx.offset);
    const { maxFrames, showFiles = "show", skipFrames = 0, highlight } = options;
    const err = new Error("trace");
    const stackStr = err.stack || "";
    const lines = stackStr.split("\n");

    lines.splice(0, 2);

    write(indent + colors.cyan(colors.bold("Call Stack")));
    write(indent + colors.gray(getSeparator(ctx)));

    const frames = lines
      .filter((line) => line?.trim())
      .map(parseStackFrame)
      .filter((f): f is NonNullable<typeof f> => f !== null);
    const visibleFrames = frames.slice(skipFrames, skipFrames + (maxFrames ?? frames.length));
    let frameCount = 0;

    for (const frame of visibleFrames) {
      frameCount++;
      const frameLines = formatStackFrame(frame, frameCount, { showFiles, highlight });
      for (const frameLine of frameLines) write(indent + frameLine);
    }

    const remaining = Math.max(0, frames.length - skipFrames - visibleFrames.length);
    if (remaining > 0) write(indent + colors.dim(`  ... ${remaining} more frames`));

    write(indent + colors.gray(getSeparator(ctx)));
  });
