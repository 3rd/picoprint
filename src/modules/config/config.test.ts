import { afterEach, describe, expect, it } from "bun:test";
import { configure, getConfig, resetConfig } from "./config";

describe("config", () => {
  afterEach(resetConfig);

  it("returns defaults when unconfigured", () => {
    expect(getConfig().code?.useBat).toBe(false);
  });

  it("merges code options", () => {
    configure({ code: { useBat: true, batTheme: "Dracula" } });
    expect(getConfig().code?.useBat).toBe(true);
    expect(getConfig().code?.batTheme).toBe("Dracula");
  });

  it("preserves prior config on partial update", () => {
    configure({ code: { useBat: true } });
    configure({ code: { batTheme: "OneHalf" } });
    const cfg = getConfig();
    expect(cfg.code?.useBat).toBe(true);
    expect(cfg.code?.batTheme).toBe("OneHalf");
  });

  it("keeps bat options snapshot-safe", () => {
    const batOptions = ["--plain"];
    configure({ code: { batOptions } });
    batOptions.push("--mutated");

    expect(getConfig().code?.batOptions).toEqual(["--plain"]);

    const configBatOptions = getConfig().code?.batOptions as string[];
    configBatOptions.push("--returned");

    expect(getConfig().code?.batOptions).toEqual(["--plain"]);
  });

  it("resets to defaults", () => {
    configure({ code: { useBat: true } });
    resetConfig();
    expect(getConfig().code?.useBat).toBe(false);
  });

  it("supports defaults section", () => {
    configure({ defaults: { style: "rounded", compact: true } });
    const cfg = getConfig();
    expect(cfg.defaults?.style).toBe("rounded");
    expect(cfg.defaults?.compact).toBe(true);
  });

  it("merges defaults and code independently", () => {
    configure({ defaults: { style: "double" } });
    configure({ code: { useBat: true } });
    const cfg = getConfig();
    expect(cfg.defaults?.style).toBe("double");
    expect(cfg.code?.useBat).toBe(true);
  });

  it("throws when called with no arguments", () => {
    // @ts-expect-error testing runtime guard
    expect(() => configure()).toThrow("picoprint configure() requires options");
  });

  it("throws when called with empty object", () => {
    // @ts-expect-error testing runtime guard
    expect(() => configure({})).toThrow("picoprint configure() requires options");
  });

  it("throws when called with a non-object argument", () => {
    expect(() => configure("bad" as never)).toThrow("picoprint configure() requires an options object");
    expect(() => configure(new Date() as never)).toThrow(
      "picoprint configure() requires an options object",
    );
  });

  it("throws when config sections are malformed", () => {
    expect(() => configure({ defaults: null as never })).toThrow("picoprint defaults must be an object");
    expect(() => configure({ defaults: [] as never })).toThrow("picoprint defaults must be an object");
    expect(() => configure({ defaults: new Date() as never })).toThrow(
      "picoprint defaults must be an object",
    );
    expect(() => configure({ code: "bad" as never })).toThrow("picoprint code must be an object");
    expect(() => configure({ code: [] as never })).toThrow("picoprint code must be an object");
    expect(() => configure({ code: /bad/ as never })).toThrow("picoprint code must be an object");
  });

  it("throws when configured default style is invalid", () => {
    expect(() => configure({ defaults: { style: "bogus" as never } })).toThrow(
      "picoprint defaults.style must be one of:",
    );
  });

  it("throws stable errors for invalid defaults", () => {
    expect(() => configure({ defaults: { compact: "yes" as never } })).toThrow(
      "picoprint defaults.compact must be a boolean",
    );
    expect(() => configure({ defaults: { maxDepth: -1 } })).toThrow(
      "picoprint defaults.maxDepth must be a non-negative integer",
    );
    expect(() => configure({ defaults: { maxDepth: 1.5 } })).toThrow(
      "picoprint defaults.maxDepth must be a non-negative integer",
    );
  });

  it("throws stable errors for invalid code options", () => {
    expect(() => configure({ code: { useBat: "yes" as never } })).toThrow(
      "picoprint code.useBat must be a boolean",
    );
    expect(() => configure({ code: { batTheme: 12 as never } })).toThrow(
      "picoprint code.batTheme must be a string",
    );
    expect(() => configure({ code: { batOptions: "--plain" as never } })).toThrow(
      "picoprint code.batOptions must be string[]",
    );
    expect(() => configure({ code: { batOptions: ["--plain", 12] as never } })).toThrow(
      "picoprint code.batOptions must be string[]",
    );
  });
});
