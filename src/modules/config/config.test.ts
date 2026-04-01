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
    expect(() => configure()).toThrow("configure() requires options");
  });

  it("throws when called with empty object", () => {
    expect(() => configure({})).toThrow("configure() requires options");
  });
});
