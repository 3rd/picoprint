import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};

const walk = (dir) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".d.ts") || entry.name.endsWith(".d.cts")) files.push(full);
  }
  return files;
};

for (const file of walk(distDir)) {
  const content = fs.readFileSync(file, "utf8");
  assert(
    !content.includes('from "@/'),
    `declaration file contains unresolved path alias: ${path.relative(root, file)}`,
  );
  assert(
    !content.includes('import("@/'),
    `declaration file contains unresolved path alias: ${path.relative(root, file)}`,
  );
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "picoprint-package-smoke-"));

const runConsumer = (scriptName) => {
  const result = spawnSync(process.execPath, [path.join(tempRoot, scriptName)], {
    cwd: tempRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`picoprint package runtime smoke failed for ${scriptName}\n${output}`);
  }
};

try {
  fs.mkdirSync(path.join(tempRoot, "node_modules"), { recursive: true });
  fs.symlinkSync(root, path.join(tempRoot, "node_modules", "picoprint"), "dir");
  fs.writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ type: "module" }, undefined, 2));
  fs.writeFileSync(
    path.join(tempRoot, "consumer-runtime.cjs"),
    `
const required = require("picoprint");

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};

assert(typeof required.default === "function", "CJS require must expose default as the callable p function");
assert(required.c === required.default.color, "CJS require must expose named c as the color namespace");
assert(required.default.c === required.default.color, "CJS default export must expose p.c as the color namespace");
assert(required.default.error === required.default.trace.error, "CJS default export must expose p.error as rich error output");
assert(typeof required.default.diff.deep === "function", "CJS default export must expose p.diff.deep");
assert(required.default.diff.nodes === undefined, "CJS default export must not expose p.diff.nodes");
assert(typeof required.default.stream.prettyPrint === "function", "CJS default export must expose p.stream.prettyPrint");
assert(required.default.stream.pp === undefined, "CJS default export must not expose p.stream.pp");
assert(required.default.tree.stats === undefined, "CJS default export must not expose p.tree.stats");
`,
  );
  fs.writeFileSync(
    path.join(tempRoot, "consumer-runtime.mjs"),
    `
import p, { c } from "picoprint";

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};

assert(typeof p === "function", "ESM import must expose default as the callable p function");
assert(c === p.color, "ESM import must expose named c as the color namespace");
assert(p.c === p.color, "ESM default export must expose p.c as the color namespace");
assert(p.error === p.trace.error, "ESM default export must expose p.error as rich error output");
assert(typeof p.diff.deep === "function", "ESM default export must expose p.diff.deep");
assert(p.diff.nodes === undefined, "ESM default export must not expose p.diff.nodes");
assert(typeof p.stream.prettyPrint === "function", "ESM default export must expose p.stream.prettyPrint");
assert(p.stream.pp === undefined, "ESM default export must not expose p.stream.pp");
assert(p.tree.stats === undefined, "ESM default export must not expose p.tree.stats");
`,
  );
  fs.writeFileSync(
    path.join(tempRoot, "consumer.mts"),
    `
import p, { c } from "picoprint";
import type {
  BackgroundColorFunction,
  BackgroundColorOption,
  BoxOptions,
  BoxStream,
  BoxStreamOptions,
  CalendarEvent,
  CalendarOptions,
  CodeOptions,
  ColorFunction,
  ColorOptionFunction,
  CompareOptions,
  ConfigureOptions,
  DiffNode,
  DiffOptions,
  DiffPathSegment,
  DiffWordsOptions,
  DirectoryEntry,
  DirectoryOptions,
  ForegroundColorFunction,
  ForegroundColorName,
  ForegroundColorOption,
  GradientLineOptions,
  LineOptions,
  LineStyleName,
  PicoprintConfig,
  PP,
  PPStream,
  PPStreamOptions,
  PrettyPrintOptions,
  RenderContext,
  RenderOptions,
  StackOptions,
  TableCompareOptions,
  TableData,
  TableOptions,
  TableStream,
  TableStreamOptions,
  TraceOptions,
  TreeNode,
  TreeOptions,
  TreeStream,
  TreeStreamOptions,
  TreeStyleName,
} from "picoprint";

type PublicTypeSmoke = {
  backgroundColorFunction?: BackgroundColorFunction;
  backgroundColorOption?: BackgroundColorOption;
  boxOptions?: BoxOptions;
  boxStream?: BoxStream;
  boxStreamOptions?: BoxStreamOptions;
  calendarEvent?: CalendarEvent;
  calendarOptions?: CalendarOptions;
  codeOptions?: CodeOptions;
  colorFunction?: ColorFunction;
  colorOptionFunction?: ColorOptionFunction;
  compareOptions?: CompareOptions;
  configureOptions?: ConfigureOptions;
  diffNode?: DiffNode;
  diffOptions?: DiffOptions;
  diffPathSegment?: DiffPathSegment;
  diffWordsOptions?: DiffWordsOptions;
  directoryEntry?: DirectoryEntry;
  directoryOptions?: DirectoryOptions;
  foregroundColorFunction?: ForegroundColorFunction;
  foregroundColorName?: ForegroundColorName;
  foregroundColorOption?: ForegroundColorOption;
  gradientLineOptions?: GradientLineOptions;
  lineOptions?: LineOptions;
  lineStyleName?: LineStyleName;
  picoprintConfig?: PicoprintConfig;
  pp?: PP;
  ppStream?: PPStream;
  ppStreamOptions?: PPStreamOptions;
  prettyPrintOptions?: PrettyPrintOptions;
  renderContext?: RenderContext;
  renderOptions?: RenderOptions;
  stackOptions?: StackOptions;
  tableCompareOptions?: TableCompareOptions;
  tableData?: TableData;
  tableOptions?: TableOptions;
  tableStream?: TableStream;
  tableStreamOptions?: TableStreamOptions;
  traceOptions?: TraceOptions;
  treeNode?: TreeNode;
  treeOptions?: TreeOptions;
  treeStream?: TreeStream;
  treeStreamOptions?: TreeStreamOptions;
  treeStyleName?: TreeStyleName;
};

const output: string = p({ ok: true });
const panel: Promise<string> = p.box.panel(async () => undefined, { title: "Async" });
const maybePanel: string | Promise<string> = p.box.panel((() => undefined) as () => void | Promise<void>, {
  title: "Maybe",
});
const color: string = p.color.red("x");
const colorAlias: string = p.c.red("x");
const namedAlias: string = c.blue("x");
const errorOutput: string = p.error(new Error("x"));
const options: BoxOptions = { title: "Box" };
const config: PicoprintConfig = { code: { useBat: false } };
const configureOptions: ConfigureOptions = { defaults: { compact: true } };
const deepNodes: DiffNode[] = p.diff.deep({ a: 1 }, { a: 2 });
const prettyStream: PPStream = p.stream.prettyPrint();
const instance: PP = p;
const publicTypeSmoke = {} satisfies PublicTypeSmoke;

// @ts-expect-error p.diff.nodes was removed from the default export
p.diff.nodes;
// @ts-expect-error p.stream.pp was removed from the default export
p.stream.pp;
// @ts-expect-error p.tree.stats was removed
p.tree.stats;
// @ts-expect-error CodeOptions.window was removed
const badCodeOptions: CodeOptions = { window: "single" };
// @ts-expect-error LineOptions.titleColor was removed
const badLineOptions: LineOptions = { titleColor: c.cyan };
// @ts-expect-error title-first panel overload was removed
p.box.panel("Title", "content");

void [
  output,
  panel,
  maybePanel,
  color,
  colorAlias,
  namedAlias,
  errorOutput,
  options,
  config,
  configureOptions,
  deepNodes,
  prettyStream,
  instance,
  publicTypeSmoke,
  badCodeOptions,
  badLineOptions,
];
`,
  );
  fs.writeFileSync(
    path.join(tempRoot, "consumer.cts"),
    `
import picoprint = require("picoprint");

const output: string = picoprint.default({ ok: true });
const color: string = picoprint.c.blue("x");

void [output, color];
`,
  );
  fs.writeFileSync(
    path.join(tempRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["consumer.mts", "consumer.cts"],
      },
      undefined,
      2,
    ),
  );

  runConsumer("consumer-runtime.cjs");
  runConsumer("consumer-runtime.mjs");

  const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
  const result = spawnSync(process.execPath, [tscBin, "--project", tempRoot], {
    cwd: tempRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`picoprint package declarations failed NodeNext smoke test\n${output}`);
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
