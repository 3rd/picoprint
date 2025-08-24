import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { table } from "./table";

describe("stream.table", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;
  let logOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    logOutput = [];
    logSpy = mock((...args) => {
      logOutput.push(args.map(String).join(" "));
    });
    console.log = logSpy;
  });

  afterEach(() => {
    console.log = originalLog;
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
