export * from "./modules/colors";
export * from "./modules/pp";
export * from "./modules/box";
export * from "./modules/calendar";
export * from "./modules/line";
export * from "./modules/code";
export * from "./modules/table";
export * from "./modules/tree";
export * from "./modules/trace";
export * from "./modules/diff";
export * from "./modules/context";
export * from "./modules/config";
import { box } from "./modules/box";
import { calendar } from "./modules/calendar";
import { code } from "./modules/code";
import * as colors from "./modules/colors";
import { configure, getConfig, resetConfig } from "./modules/config";
import { createContext, decreaseIndent, getCurrentContext, increaseIndent } from "./modules/context";
import { compare, deepDiff, diff, diffWords } from "./modules/diff";
import { line } from "./modules/line";
import { prettyPrint } from "./modules/pp";
import * as stream from "./modules/stream";
import { compareInTable, table } from "./modules/table";
import { callStack, stack, trace, error as traceError } from "./modules/trace";
import { directory, tree, treeFromObject, treeMulti, treeSearch, treeStats } from "./modules/tree";
import { toColoredInlineString } from "./utils/log-format";
import { format, write } from "./utils/writer";
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

const extendedTable = Object.assign(table, {
  compare: compareInTable,
});

const extendedTree = Object.assign(tree, {
  fromObject: treeFromObject,
  multi: treeMulti,
  search: treeSearch,
  stats: treeStats,
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

const ppLog = (...args: unknown[]) => {
  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);
  const parts = args.map(toColoredInlineString);
  const combined = parts.join(" ");
  const lines = combined.split(/\r?\n/);
  for (const l of lines) write(indent + l);
  return combined;
};

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
  error: traceError,
  diff: extendedDiff,
  trace: extendedTrace,
  color: colors,
  c: colors,
  stream,
  format,
  configure,
  getConfig,
  resetConfig,
  createContext,
});

export type PP = typeof pp;

export { colors as c, colors as color };

export default pp;
