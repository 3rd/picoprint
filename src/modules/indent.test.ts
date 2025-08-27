import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";

let p: typeof import("@/.").default;

beforeAll(async () => {
  process.env.FORCE_COLOR = "1";
  const mod = await import("@/.");
  p = mod.default;
});

describe("p.indent / p.dedent (global indent control)", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;
  let output: string[];

  beforeEach(() => {
    originalLog = console.log;
    output = [];
    logSpy = mock((...args) => {
      output.push(args.map(String).join(" "));
    });
    console.log = logSpy;
    process.env.FORCE_COLOR = "1";
  });

  afterEach(() => {
    console.log = originalLog;
    for (let i = 0; i < 10; i++) p.dedent();
  });

  it("increases and decreases indent across calls", () => {
    p.log("a");
    p.indent();
    p.log("b");
    p.indent(3);
    p.log("c");
    p.dedent();
    p.log("d");
    p.dedent();
    p.log("e");

    const clean = output.map(stripAnsi);
    expect(clean[0]).toBe("a");
    expect(clean[1]).toBe("  b"); // 2 spaces
    expect(clean[2]).toBe("     c"); // 2 + 3 spaces
    expect(clean[3]).toBe("  d"); // back to 2
    expect(clean[4]).toBe("e"); // back to 0
  });

  it("does not interfere with temporary contexts (box capture)", () => {
    p.indent(); // set a base indent of 2
    p.log("outer-1");

    p.box(
      () => {
        p.log("inner-1");
        p.indent();
        p.log("inner-2");
        p.dedent();
        p.log("inner-3");
      },
      { title: "t", padding: 0, style: "ascii" },
    );

    p.log("outer-2");

    const clean = output.map(stripAnsi);
    const last = clean[clean.length - 1] ?? "";
    expect(last.startsWith("  outer-2")).toBe(true);
  });

  it("multiple dedents pop multiple levels", () => {
    p.log("start");
    p.indent(); // +2
    p.indent(3); // +5
    p.log("deep");
    // pop two prior indent levels with two calls
    p.dedent();
    p.dedent();
    p.log("shallow");

    const clean = output.map(stripAnsi);
    expect(clean[0]).toBe("start");
    expect(clean[1]).toBe("     deep"); // 5 spaces
    expect(clean[2]).toBe("shallow"); // back to 0 after removing 2 levels
  });
});
