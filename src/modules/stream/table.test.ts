import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { configure, resetConfig } from "../config";
import { table, type TableStreamOptions } from "./table";

describe("stream.table", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
    resetConfig();
  });

  it("throws a stable error when columns are missing, empty, or malformed", () => {
    const expectedMessage = "picoprint stream.table columns must be a non-empty string[]";

    expect(() => table(undefined as unknown as TableStreamOptions)).toThrow(expectedMessage);
    expect(() => table(null as unknown as TableStreamOptions)).toThrow(expectedMessage);
    expect(() => table({} as TableStreamOptions)).toThrow(expectedMessage);
    expect(() => table({ columns: [] })).toThrow(expectedMessage);
    expect(() => table({ columns: ["name", 1 as unknown as string] })).toThrow(expectedMessage);

    class TableOptionsInstance {
      columns = ["name"];
    }

    expect(() => table(new TableOptionsInstance() as never)).toThrow(
      "picoprint stream.table options must be an object",
    );
  });

  it("throws when style is invalid", () => {
    expect(() => table({ columns: ["name"], style: "bogus" as never })).toThrow(
      "picoprint style must be one of:",
    );
    expect(() => table({ columns: ["name"], maxWidth: -1 })).toThrow(
      "picoprint maxWidth must be a non-negative integer",
    );
    expect(() => table({ columns: ["name"], align: "left" as never })).toThrow(
      "picoprint align must be an object",
    );
    expect(() => table({ columns: ["name"], align: new Date() as never })).toThrow(
      "picoprint align must be an object",
    );
    expect(() => table({ columns: ["name"], align: { name: "middle" as never } })).toThrow(
      "picoprint align.name must be one of:",
    );
    expect(() => table({ columns: ["name"], showIndex: "yes" as never })).toThrow(
      "picoprint showIndex must be a boolean",
    );
    expect(() => table({ columns: ["name"], compact: "yes" as never })).toThrow(
      "picoprint compact must be a boolean",
    );
  });

  it("prints header once, then rows, then bottom on close", () => {
    const t = table({ columns: ["name", "age"], showIndex: true });
    t.row({ name: "Alice", age: 30 });
    t.row({ name: "Bob", age: 42 });
    t.close();
    const clean = logOutput.map(stripAnsi);

    expect(clean.length).toBe(6);

    expect(clean[1]).toContain("name");
    expect(clean[1]).toContain("age");

    // row 3 should contain Alice and 30
    expect(clean[3]).toContain("30");
    expect(clean[3]).toContain("1"); // index

    // row 4 should contain Bob and 42
    expect(clean[4]).toContain("42");
    expect(clean[4]).toContain("2"); // index

    // check table borders
    expect(clean[0]).toContain("┌"); // top border
    expect(clean[5]).toContain("└"); // bottom border
  });

  it("uses maxWidth as the fixed streaming column budget", () => {
    const t = table({ columns: ["status"] });
    t.row({ status: "complete" });
    t.close();

    const clean = logOutput.map(stripAnsi).join("\n");
    expect(clean).toContain("complete");
    expect(clean).not.toContain("com...");
  });

  it("uses configured style and compact defaults", () => {
    configure({ defaults: { style: "rounded", compact: true } });
    const t = table({ columns: ["name"] });
    t.row({ name: "Ada" });
    t.close();
    const clean = logOutput.map(stripAnsi);

    expect(clean[0]).toContain("╭");
    expect(clean[1]).toMatch(/^│ name\s+│$/);
    expect(clean[1]).not.toContain("│  name");
  });

  it("throws a stable error for invalid row data while open", () => {
    const t = table({ columns: ["name"] });

    expect(() => t.row(undefined as never)).toThrow("picoprint stream.table row data must be a plain object");
    expect(() => t.row(null as never)).toThrow("picoprint stream.table row data must be a plain object");
    expect(() => t.row(["Alice"] as never)).toThrow("picoprint stream.table row data must be a plain object");
    expect(() => t.row(new Date("2024-01-01") as never)).toThrow(
      "picoprint stream.table row data must be a plain object",
    );

    expect(logOutput.map(stripAnsi).join("\n")).not.toContain("Alice");
  });

  it("does not write more output after close", () => {
    const t = table({ columns: ["name"] });
    t.row({ name: "Alice" });
    t.close();
    const afterFirstClose = logOutput.length;

    t.close();
    t.row({ name: "Bob" });
    t.row(null as never);

    expect(logOutput).toHaveLength(afterFirstClose);
    expect(logOutput.map(stripAnsi).join("\n")).not.toContain("Bob");
  });
});
