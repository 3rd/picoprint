import { afterEach, beforeEach, describe, expect, it } from "bun:test";
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
  PicocprintConfig,
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
  TreeStatsResult,
  TreeStream,
  TreeStreamOptions,
  TreeStyleName,
} from "@/.";
import p, { c } from "@/.";
import { _resetWriterStack, pushWriter } from "@/utils/writer";

type RootPublicTypeSmoke = {
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
  pp?: PP;
  ppStream?: PPStream;
  ppStreamOptions?: PPStreamOptions;
  picocprintConfig?: PicocprintConfig;
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
  treeStatsResult?: TreeStatsResult;
  treeStream?: TreeStream;
  treeStreamOptions?: TreeStreamOptions;
  treeStyleName?: TreeStyleName;
};

const rootPublicTypeSmoke = {} satisfies RootPublicTypeSmoke;
const customColorOption = ((value: string) => value) satisfies ForegroundColorOption;
const customBackgroundOption = ((value: string) => value) satisfies BackgroundColorOption;

const rootPublicInputSmoke = {
  boxOptions: {
    borderColor: customColorOption,
    background: customBackgroundOption,
  },
  calendarOptions: {
    events: [{ date: new Date(2024, 0, 1), label: "launch", color: customColorOption }] as const,
  },
  codeOptions: {
    borderColor: customColorOption,
    background: customBackgroundOption,
  },
  compareOptions: { labels: ["left", "right"] as const },
  configOptions: { code: { batOptions: ["--plain"] as const } },
  gradientLineOptions: { start: customColorOption, end: customColorOption },
  lineOptions: { color: customColorOption },
  tableData: [{ name: "Ada" }] as const,
  tableOptions: { columns: ["name"] as const },
  tableStreamOptions: { columns: ["name"] as const },
  treeNode: { name: "root", children: [{ name: "child" }] as const },
  directoryEntry: {
    name: "root",
    type: "directory",
    children: [{ name: "file", type: "file" }] as const,
  },
} satisfies {
  boxOptions: BoxOptions;
  calendarOptions: CalendarOptions;
  codeOptions: CodeOptions;
  compareOptions: CompareOptions;
  configOptions: ConfigureOptions;
  gradientLineOptions: GradientLineOptions;
  lineOptions: LineOptions;
  tableData: TableData;
  tableOptions: TableOptions;
  tableStreamOptions: TableStreamOptions;
  treeNode: TreeNode;
  directoryEntry: DirectoryEntry;
};

describe("p default export wiring", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
    p.resetConfig();
  });

  it("exposes the colors namespace as c, p.c, and p.color", () => {
    expect(c).toBe(p.color);
    expect(p.c).toBe(p.color);
    expect(typeof c.red).toBe("function");
  });

  it("keeps reusable public types exported from the root", () => {
    expect(rootPublicTypeSmoke).toEqual({});
    expect(rootPublicInputSmoke.tableOptions.columns).toEqual(["name"]);
    if (false) {
      const maybeAsync = (() => undefined) as () => void | Promise<void>;
      const formatResult: string | Promise<string> = p.format(maybeAsync);
      const boxResult: string | Promise<string> = p.box(maybeAsync);
      const panelResult: string | Promise<string> = p.box.panel(maybeAsync);
      const legacyPanelResult: string | Promise<string> = p.box.panel("Legacy", maybeAsync);
      const asyncLegacyPanelResult: Promise<string> = p.box.panel("Legacy", async () => undefined);
      expect([formatResult, boxResult, panelResult, legacyPanelResult, asyncLegacyPanelResult]).toHaveLength(5);
    }
  });

  it("pretty-prints through the callable root", () => {
    const result = p({ a: 1 });
    expect(result).toContain("a");
    expect(logOutput.length).toBeGreaterThan(0);
  });

  it("honors options passed to the callable root", () => {
    p({ a: { b: { c: { d: 1 } } } }, { maxDepth: 1, compact: false });
    const output = logOutput.join("\n");
    expect(output).toContain("...");
    expect(output).not.toContain("d");
  });

  it("honors offset passed to the callable root", () => {
    const output = p("hello", { offset: 3 });

    expect(output).toMatch(/^ {3}/);
    expect(logOutput[0]).toMatch(/^ {3}/);
  });

  it("attaches renderer namespaces", () => {
    expect(typeof p.box).toBe("function");
    expect(typeof p.box.panel).toBe("function");
    expect(typeof p.table).toBe("function");
    expect(typeof p.table.compare).toBe("function");
    expect(typeof p.tree).toBe("function");
    expect(typeof p.tree.fromObject).toBe("function");
    expect(typeof p.tree.multi).toBe("function");
    expect(typeof p.tree.search).toBe("function");
    expect(typeof p.tree.stats).toBe("function");
    expect(typeof p.tree.directory).toBe("function");
    expect(typeof p.diff).toBe("function");
    expect(typeof p.diff.words).toBe("function");
    expect(typeof p.diff.nodes).toBe("function");
    expect(typeof p.diff.deep).toBe("function");
    expect(typeof p.diff.compare).toBe("function");
    expect(typeof p.trace).toBe("function");
    expect(typeof p.trace.stack).toBe("function");
    expect(typeof p.trace.error).toBe("function");
    expect(typeof p.trace.callStack).toBe("function");
    expect(typeof p.error).toBe("function");
    expect(typeof p.line).toBe("function");
    expect(typeof p.code).toBe("function");
    expect(typeof p.calendar).toBe("function");
  });

  it("attaches stream factories", () => {
    expect(typeof p.stream.box).toBe("function");
    expect(typeof p.stream.table).toBe("function");
    expect(typeof p.stream.tree).toBe("function");
    expect(typeof p.stream.pp).toBe("function");
    expect(typeof p.stream.prettyPrint).toBe("function");
    expect(p.stream.prettyPrint).toBe(p.stream.pp);
  });

  it("renders multiple trees through p.tree.multi and skips undefined entries", () => {
    const output = p.tree.multi([{ name: "config" }, undefined, { name: "runtime" }]);

    expect(output).toContain("Tree 1: config");
    expect(output).toContain("config");
    expect(output).toContain("Tree 2: runtime");
    expect(output).toContain("runtime");
    expect(output).not.toContain("Tree 3:");
    expect(output).not.toContain("undefined");
    expect(logOutput.join("\n")).toBe(output);
  });

  it("throws stable package errors for invalid line-style options", () => {
    const invalidStyle = "bogus" as never;

    expect(() => p.box("x", { style: invalidStyle })).toThrow("picoprint style must be one of:");
    expect(() => p.line({ style: invalidStyle })).toThrow("picoprint style must be one of:");
    expect(() => p.table([{ x: 1 }], { style: invalidStyle })).toThrow("picoprint style must be one of:");
    expect(() => p.code("x", { frame: invalidStyle })).toThrow("picoprint frame must be one of:");
    expect(() => p.stream.box({ style: invalidStyle })).toThrow("picoprint style must be one of:");
  });

  it("streams pretty-printed values via p.stream.pp", () => {
    const stream = p.stream.pp();
    stream.value({ x: 1 });
    stream.text("done");
    stream.close();
    const output = logOutput.join("\n");
    expect(output).toContain("x");
    expect(output).toContain("done");
  });

  it("streams pretty-printed values via p.stream.prettyPrint", () => {
    const stream = p.stream.prettyPrint();
    stream.value({ x: 1 });
    stream.text("done");
    stream.close();
    const output = logOutput.join("\n");
    expect(output).toContain("x");
    expect(output).toContain("done");
  });

  it("captures table output as a string via p.format", () => {
    const captured = p.format(() => {
      p.table([{ name: "ada" }]);
    });
    expect(captured).toContain("name");
    expect(captured).toContain("ada");
    expect(logOutput).toHaveLength(0);
  });

  it("throws stable package errors for invalid root helper arguments", () => {
    expect(() => p.format(12 as never)).toThrow("picoprint format callback must be a function");
    expect(() => p.indent("2" as never)).toThrow("picoprint indent amount must be a non-negative finite number");
    expect(() => p.createContext("2" as never)).toThrow("picoprint offset must be a non-negative finite number");
    expect(() => p("hello", { offset: "2" as never })).toThrow("picoprint offset must be a non-negative finite number");
    expect(() => p("hello", new Date() as never)).toThrow("picoprint pp options must be an object");
    expect(() => p.box("hello", new Date() as never)).toThrow("picoprint box options must be an object");
    expect(() => p.box("hello", { renderContext: { offset: 0 } as never })).toThrow(
      "picoprint renderContext must be a RenderContext",
    );
    expect(() => p.line(new Date() as never)).toThrow("picoprint line options must be an object");
    expect(() => p.line.gradient(new Date() as never)).toThrow("picoprint line.gradient options must be an object");
    expect(() => p.table([{ a: 1 }], new Date() as never)).toThrow("picoprint table options must be an object");
    expect(() => p.table([{ a: 1 }], { align: new Date() as never })).toThrow("picoprint align must be an object");
    expect(() => p.diff({ a: 1 }, { a: 2 }, new Date() as never)).toThrow("picoprint diff options must be an object");
    expect(() => p.code("hello", new Date() as never)).toThrow("picoprint code options must be an object");
    expect(() => p.calendar(new Date(2025, 0, 1), new Date() as never)).toThrow(
      "picoprint calendar options must be an object",
    );
    expect(() => p.calendar(new Date(2025, 0, 1), { events: [new Date() as never] })).toThrow(
      "picoprint events[0] must be an object",
    );
    expect(() => p.trace("hello", new Date() as never)).toThrow("picoprint trace options must be an object");
    expect(() => p.trace.stack(123 as never)).toThrow(
      "picoprint trace.stack argument must be an Error, stack string, or options object",
    );
    expect(() => p.tree({ name: "root" }, new Date() as never)).toThrow("picoprint tree options must be an object");
    expect(() => p.tree(new Date() as never)).toThrow("picoprint tree node must be an object");
    expect(() => p.tree({ name: "root", metadata: new Date() as never })).toThrow(
      "picoprint tree node.metadata must be an object",
    );
    expect(() => p.tree.fromObject({ a: 1 }, new Date() as never)).toThrow(
      "picoprint tree.fromObject second argument must be a name string or options object",
    );
    expect(() => p.tree.stats({ name: "root" }, new Date() as never)).toThrow(
      "picoprint tree.stats options must be an object",
    );
    expect(() => p.stream.box(new Date() as never)).toThrow("picoprint stream.box options must be an object");
    expect(() => p.stream.pp(new Date() as never)).toThrow("picoprint stream.pp options must be an object");
    expect(() => p.stream.tree(new Date() as never)).toThrow("picoprint stream.tree options must be an object");
    class TableStreamOptionsInstance {
      columns = ["name"];
    }
    expect(() => p.stream.table(new TableStreamOptionsInstance() as never)).toThrow(
      "picoprint stream.table options must be an object",
    );
    expect(() => p.stream.table({ columns: ["name"], align: new Date() as never })).toThrow(
      "picoprint align must be an object",
    );
    expect(logOutput).toHaveLength(0);
  });

  it("exposes p.error as the rich error renderer alias", () => {
    expect(p.error).toBe(p.trace.error);

    const output = p.error(new TypeError("bad input"));

    expect(output).toContain("bad input");
    expect(output).toContain("Type: TypeError");
    expect(logOutput.join("\n")).toBe(output);
  });

  it("passes options through p.error alias", () => {
    const output = p.error("bad input", { offset: 2, footer: false });

    expect(output).toMatch(/^ {2}/);
    expect(logOutput[0]).toMatch(/^ {2}/);
  });

  it("passes stack options through p.trace.callStack", () => {
    const output = p.trace.callStack({ maxFrames: 1, showFiles: "hide" });

    expect(output).toContain("Call Stack");
    expect(output).toContain("#1");
    expect(output).not.toContain("     at ");
    expect(logOutput.join("\n")).toBe(output);
  });

  it("combines p.tree.search query with caller filter options", () => {
    const output = p.tree.search(
      {
        name: "root",
        children: [
          { name: "apple", metadata: { visible: true } },
          { name: "application", metadata: { visible: false } },
        ],
      },
      "app",
      {
        filter: (node) => node.name === "root" || node.metadata?.visible === true,
      },
    );

    expect(output).toContain("apple");
    expect(output).not.toContain("application");
    expect(logOutput.join("\n")).toBe(output);
  });

  it("searches falsy values through p.tree.search", () => {
    const output = p.tree.search(
      {
        name: "root",
        children: [
          { name: "zero", value: 0 },
          { name: "flag", value: false },
          { name: "one", value: 1 },
        ],
      },
      "false",
    );

    expect(output).toContain("flag");
    expect(output).not.toContain("zero");
    expect(output).not.toContain("one");
    expect(logOutput.join("\n")).toBe(output);
  });

  it("deep-diffs through p.diff.deep with the public two-arg shape", () => {
    const nodes = p.diff.deep({ a: 1 }, { a: 2 });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.type).toBe("modified");
  });

  it("exposes p.diff.nodes as the pure diff node alias", () => {
    expect(p.diff.nodes).toBe(p.diff.deep);
    const nodes = p.diff.nodes({ a: 1 }, { a: 2 });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.type).toBe("modified");
  });
});
