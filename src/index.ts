import { box } from "./modules/box";
import { calendar } from "./modules/calendar";
import { code } from "./modules/code";
import * as colors from "./modules/colors";
import { configure, getConfig, resetConfig } from "./modules/config";
import { createContext, decreaseIndent, increaseIndent } from "./modules/context";
import { compare, deepDiff, diff, diffWords } from "./modules/diff";
import { line } from "./modules/line";
import { prettyPrint } from "./modules/pp";
import * as stream from "./modules/stream";
import { compareInTable, table } from "./modules/table";
import { callStack, stack, trace, error as traceError } from "./modules/trace";
import { directory, tree, treeFromObject, treeMulti, treeSearch } from "./modules/tree";
import { toColoredInlineString } from "./utils/format-value";
import { format as captureFormat, writeLog } from "./utils/writer";

export type { BoxOptions } from "./modules/box";
export type { CalendarEvent, CalendarOptions } from "./modules/calendar";
export type { CodeOptions } from "./modules/code";
export type { ForegroundColorName } from "./modules/colors";
export type { ConfigureOptions, PicoprintConfig } from "./modules/config";
export type { RenderContext, RenderOptions } from "./modules/context";
export type {
  CompareOptions,
  DiffNode,
  DiffOptions,
  DiffPathSegment,
  DiffWordsOptions,
} from "./modules/diff";
export type { GradientLineOptions, LineOptions } from "./modules/line";
export type { PrettyPrintOptions } from "./modules/pp";
export type {
  BoxStream,
  BoxStreamOptions,
  PPStream,
  PPStreamOptions,
  TableStream,
  TableStreamOptions,
  TreeStream,
  TreeStreamOptions,
} from "./modules/stream";
export type { TableCompareOptions, TableData, TableOptions } from "./modules/table";
export type { StackOptions, TraceOptions } from "./modules/trace";
export type { DirectoryEntry, DirectoryOptions, TreeNode, TreeOptions, TreeStyleName } from "./modules/tree";
export type {
  BackgroundColorFunction,
  BackgroundColorOption,
  ColorFunction,
  ColorOptionFunction,
  ForegroundColorFunction,
  ForegroundColorOption,
} from "./utils/colors";
export type { LineStyleName } from "./utils/line-styles";

const extendedTable = Object.assign(table, {
  compare: compareInTable,
});

const extendedTree = Object.assign(tree, {
  fromObject: treeFromObject,
  multi: treeMulti,
  search: treeSearch,
  directory,
});

const extendedDiff = Object.assign(diff, {
  words: diffWords,
  deep: deepDiff,
  compare,
});

const extendedTrace = Object.assign(trace, {
  stack,
  error: traceError,
  callStack,
});

const ppLog = (...args: unknown[]) => writeLog(args, toColoredInlineString);

type FormatResult<T> = T extends PromiseLike<unknown> ? Promise<string> : string;
type FormatFunction = <T>(fn: () => T) => FormatResult<T>;

const ppFormat: FormatFunction = captureFormat;

const pp = Object.assign((...args: Parameters<typeof prettyPrint>) => prettyPrint(...args), {
  log: ppLog,
  indent: increaseIndent,
  dedent: decreaseIndent,
  box,
  calendar,
  line,
  code,
  table: extendedTable,
  tree: extendedTree,
  diff: extendedDiff,
  trace: extendedTrace,
  error: traceError,
  c: colors,
  color: colors,
  stream,
  format: ppFormat,
  configure,
  getConfig,
  resetConfig,
  createContext,
});

export type PP = typeof pp;

export { colors as c };

export default pp;
