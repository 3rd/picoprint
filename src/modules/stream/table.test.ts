import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { table } from "./table";

describe("stream.table", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
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
});
