import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  _resetWriterStack,
  captureLines,
  captureLinesAsync,
  format,
  popWriter,
  pushWriter,
  renderAndReturn,
  write,
} from "./writer";

describe("writer", () => {
  afterEach(() => {
    _resetWriterStack();
  });

  it("should write to console.log by default", () => {
    const spy = mock();
    const orig = console.log;
    console.log = spy;
    write("hello");
    console.log = orig;
    expect(spy).toHaveBeenCalledWith("hello");
  });

  it("should redirect to pushed writer", () => {
    const lines: string[] = [];
    pushWriter((line) => lines.push(line));
    write("one");
    write("two");
    popWriter();
    expect(lines).toEqual(["one", "two"]);
  });

  it("should restore previous writer after pop", () => {
    const outer: string[] = [];
    const inner: string[] = [];

    pushWriter((line) => outer.push(line));
    write("outer-1");

    pushWriter((line) => inner.push(line));
    write("inner-1");
    popWriter();

    write("outer-2");
    popWriter();

    expect(outer).toEqual(["outer-1", "outer-2"]);
    expect(inner).toEqual(["inner-1"]);
  });

  it("should fall back to console.log after all writers popped", () => {
    const spy = mock();
    const orig = console.log;
    console.log = spy;

    pushWriter(() => {});
    write("captured");
    popWriter();

    write("default");
    console.log = orig;

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("default");
  });

  describe("captureLines", () => {
    it("should capture lines and return result", () => {
      const { lines, result } = captureLines(() => {
        write("line 1");
        write("line 2");
        return 42;
      });
      expect(lines).toEqual(["line 1", "line 2"]);
      expect(result).toBe(42);
    });

    it("should restore writer on error", () => {
      const outer: string[] = [];
      pushWriter((line) => outer.push(line));

      expect(() =>
        captureLines(() => {
          write("inside");
          throw new Error("boom");
        }),
      ).toThrow("boom");

      write("after-error");
      popWriter();
      expect(outer).toEqual(["after-error"]);
    });

    it("should support nesting", () => {
      const { lines: outerLines } = captureLines(() => {
        write("outer");
        const { lines: innerLines } = captureLines(() => {
          write("inner");
        });
        expect(innerLines).toEqual(["inner"]);
        write("outer again");
      });
      expect(outerLines).toEqual(["outer", "outer again"]);
    });
  });

  describe("format", () => {
    it("should return joined lines without printing", () => {
      const spy = mock();
      const orig = console.log;
      console.log = spy;

      const result = format(() => {
        write("line 1");
        write("line 2");
      });

      console.log = orig;
      expect(result).toBe("line 1\nline 2");
      expect(spy).not.toHaveBeenCalled();
    });

    it("should return empty string for empty callback", () => {
      const result = format(() => {});
      expect(result).toBe("");
    });

    it("should work inside a box-like capture", () => {
      const boxCapture: string[] = [];
      pushWriter((line) => boxCapture.push(line));

      const result = format(() => {
        write("formatted");
      });

      write("to-box");
      popWriter();

      expect(result).toBe("formatted");
      expect(boxCapture).toEqual(["to-box"]);
    });

    it("should restore writer on error", () => {
      expect(() =>
        format(() => {
          throw new Error("boom");
        }),
      ).toThrow("boom");

      const spy = mock();
      const orig = console.log;
      console.log = spy;
      write("after-error");
      console.log = orig;
      expect(spy).toHaveBeenCalledWith("after-error");
    });

    it("throws a stable error for invalid callbacks", () => {
      expect(() => format(12 as never)).toThrow("picoprint format callback must be a function");
    });

    it("should capture async callback output without printing", async () => {
      const spy = mock();
      const orig = console.log;
      console.log = spy;

      const result = await format(async () => {
        write("before-await");
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        write("after-await");
      });

      console.log = orig;
      expect(result).toBe("before-await\nafter-await");
      expect(spy).not.toHaveBeenCalled();
    });

    it("should treat thenables as async callback results", async () => {
      const result = await format(() => {
        write("before-thenable");
        return {
          then: (resolve: (value: unknown) => void) => {
            write("inside-thenable");
            resolve(undefined);
          },
        };
      });

      expect(result).toBe("before-thenable\ninside-thenable");
    });
  });

  describe("renderAndReturn", () => {
    it("should capture, write, and return joined lines", () => {
      const output: string[] = [];
      pushWriter((line) => output.push(line));

      const result = renderAndReturn(() => {
        write("line 1");
        write("line 2");
      });

      popWriter();

      expect(result).toBe("line 1\nline 2");
      expect(output).toEqual(["line 1", "line 2"]);
    });

    it("should return empty string for empty callback", () => {
      const result = renderAndReturn(() => {});
      expect(result).toBe("");
    });

    it("should propagate errors and clean up", () => {
      const output: string[] = [];
      pushWriter((line) => output.push(line));

      expect(() =>
        renderAndReturn(() => {
          write("before");
          throw new Error("fail");
        }),
      ).toThrow("fail");

      write("after");
      popWriter();
      expect(output).toEqual(["after"]);
    });
  });

  describe("captureLinesAsync", () => {
    it("should capture lines from async callback", async () => {
      const { lines, result } = await captureLinesAsync(async () => {
        write("before-await");
        await new Promise<void>((r) => {
          setTimeout(r, 10);
        });
        write("after-await");
        return 42;
      });

      expect(lines).toEqual(["before-await", "after-await"]);
      expect(result).toBe(42);
    });

    it("should restore writer on async error", async () => {
      const outer: string[] = [];
      pushWriter((line) => outer.push(line));

      try {
        await captureLinesAsync(async () => {
          write("inside");
          await new Promise<void>((r) => {
            setTimeout(r, 10);
          });
          throw new Error("async-boom");
        });
      } catch (error) {
        expect((error as Error).message).toBe("async-boom");
      }

      write("recovered");
      popWriter();
      expect(outer).toEqual(["recovered"]);
    });
  });

  describe("p.format integration", () => {
    it("should capture nested module output without printing", () => {
      const spy = mock();
      const orig = console.log;
      console.log = spy;

      // eslint-disable-next-line node/global-require -- import after the console.log spy is installed
      const p = require("@/index").default;
      const result = p.format(() => {
        p.box("hello from box");
        p.line("separator");
      });

      console.log = orig;
      expect(spy).not.toHaveBeenCalled();
      expect(result).toContain("hello from box");
      expect(result).toContain("separator");
    });

    it("should capture async module output without printing", async () => {
      const spy = mock();
      const orig = console.log;
      console.log = spy;

      // eslint-disable-next-line node/global-require -- import after the console.log spy is installed
      const p = require("@/index").default;
      const result = await p.format(async () => {
        await p.box(async () => {
          p.log("async box");
          return 42;
        });
      });

      console.log = orig;
      expect(spy).not.toHaveBeenCalled();
      expect(result).toContain("async box");
    });
  });
});
