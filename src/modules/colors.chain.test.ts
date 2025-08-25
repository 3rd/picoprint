import { afterEach, beforeAll, describe, expect, it } from "bun:test";

let p: typeof import("@/.").default;

beforeAll(async () => {
  process.env.FORCE_COLOR = "1";
  const mod = await import("@/.");
  p = mod.default;
});

describe("chainable colors (p.*)", () => {
  afterEach(() => {
    process.env.FORCE_COLOR = "1";
  });

  it("applies left-to-right styles (bold then yellow)", () => {
    const apply = p.bold.yellow;
    expect(typeof apply).toBe("function");
    const s = apply("text");
    expect(typeof s).toBe("string");
    expect(s).toContain("text");
  });

  it("mixes foreground and background styles", () => {
    const apply = p.yellow.bgBlue;
    expect(typeof apply).toBe("function");
    const s = apply("X");
    expect(typeof s).toBe("string");
    expect(s).toContain("X");
  });

  it("keeps brand of first style in chain (bg)", () => {
    const fn = p.bgBlue.white as unknown as ((s: string) => string) & { __kind?: string };
    expect(fn.__kind).toBe("bg");
    const out = fn("ok");
    expect(typeof out).toBe("string");
    expect(out).toContain("ok");
  });
});
