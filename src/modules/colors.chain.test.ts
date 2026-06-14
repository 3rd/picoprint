import { describe, expect, it } from "bun:test";

const runWithColor = (code: string) => {
  const result = Bun.spawnSync({
    cmd: ["bun", "-e", code],
    env: { ...process.env, FORCE_COLOR: "1", NO_COLOR: undefined },
  });
  return result.stdout.toString();
};

const BOLD = "\\u001b[1m";
const RED = "\\u001b[31m";
const YELLOW = "\\u001b[33m";
const BG_BLUE = "\\u001b[44m";
const WHITE = "\\u001b[37m";

describe("chainable colors (p.*)", () => {
  it("evaluates color support when the chain is called", () => {
    const result = Bun.spawnSync({
      cmd: [
        "bun",
        "-e",
        `process.env.NO_COLOR = "1";
         const p = (await import("./src/index")).default;
         delete process.env.NO_COLOR;
         process.env.FORCE_COLOR = "1";
         process.stdout.write(JSON.stringify(p.color.red("text")));`,
      ],
      env: { ...process.env, FORCE_COLOR: undefined, NO_COLOR: undefined },
    });
    const out = result.stdout.toString();

    expect(out).toContain("text");
    expect(out).toContain(RED);
  });

  it("applies left-to-right styles (bold then yellow)", () => {
    const out = runWithColor(
      `const p = (await import("./src/index")).default; process.stdout.write(JSON.stringify(p.color.bold.yellow("text")));`,
    );
    expect(out).toContain("text");
    // earlier chain links wrap innermost: bold("text") wrapped by yellow
    const boldIndex = out.indexOf(BOLD);
    const yellowIndex = out.indexOf(YELLOW);
    expect(boldIndex).toBeGreaterThanOrEqual(0);
    expect(yellowIndex).toBeGreaterThanOrEqual(0);
    expect(yellowIndex).toBeLessThan(boldIndex);
  });

  it("mixes foreground and background styles", () => {
    const out = runWithColor(
      `const p = (await import("./src/index")).default; process.stdout.write(JSON.stringify(p.color.yellow.bgBlue("X")));`,
    );
    expect(out).toContain("X");
    expect(out).toContain(YELLOW);
    expect(out).toContain(BG_BLUE);
  });

  it("keeps brand of first style in chain (bg)", () => {
    const out = runWithColor(
      `const p = (await import("./src/index")).default;
       const fn = p.color.bgBlue.white;
       process.stdout.write(JSON.stringify({ kind: fn.__kind, out: fn("ok") }));`,
    );
    expect(out).toContain('"kind":"bg"');
    expect(out).toContain("ok");
    expect(out).toContain(BG_BLUE);
    expect(out).toContain(WHITE);
  });
});
