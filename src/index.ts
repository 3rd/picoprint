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
import { calendar, calendarWithEvents } from "./modules/calendar";
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

type PPType = ((...args: Parameters<typeof prettyPrint>) => ReturnType<typeof prettyPrint>) & {
  log: (...args: unknown[]) => string;
  indent: (amount?: number) => void;
  dedent: () => void;
  box: typeof box;
  calendar: typeof calendar;
  calendarWithEvents: typeof calendarWithEvents;
  line: typeof line;
  code: typeof code;
  table: { compare: typeof compareInTable } & typeof table;
  tree: {
    fromObject: typeof treeFromObject;
    multi: typeof treeMulti;
    search: typeof treeSearch;
    stats: typeof treeStats;
    directory: typeof directory;
  } & typeof tree;
  stream: typeof import("./modules/stream");
  trace: typeof trace;
  stack: typeof stack;
  error: typeof traceError;
  callStack: typeof callStack;
  diff: typeof diff;
  compare: typeof compare;
  diffWords: typeof diffWords;
  deepDiff: typeof deepDiff;
  configure: typeof configure;
  getConfig: typeof getConfig;
  resetConfig: typeof resetConfig;
  createContext: typeof import("./modules/context").createContext;
} & typeof colors;

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

const ppLog = (...args: unknown[]): string => {
  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);
  const parts = args.map(toColoredInlineString);
  const combined = parts.join(" ");
  const lines = combined.split(/\r?\n/);
  for (const l of lines) console.log(indent + l);
  return combined;
};

const pp = Object.assign((...args: Parameters<typeof prettyPrint>) => prettyPrint(...args), {
  log: ppLog,
  indent: increaseIndent,
  dedent: decreaseIndent,
  box,
  calendar,
  calendarWithEvents,
  line,
  code,
  table: extendedTable,
  tree: extendedTree,
  trace,
  stack,
  error: traceError,
  callStack,
  diff,
  compare,
  diffWords,
  deepDiff,
  configure,
  getConfig,
  resetConfig,
  createContext,
  stream,
  ...colors,
}) as PPType;

export default pp;
