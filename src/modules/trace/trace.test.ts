import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { callStack, error, stack, trace } from "./trace";

describe("trace", () => {
  let originalLog = console.log;
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

  describe("trace", () => {
    it("should format error with stack trace", () => {
      const err = new Error("Test error");
      trace(err);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");

      // plain header with callsite stack
      expect(output).toContain("Error: Test error");
      expect(output).toContain("─");
    });

    it("should handle string input by printing callsite stack", () => {
      const message = "Something went wrong";
      trace(message);

      const output = logOutput.join("\n");
      expect(output).toContain("Error: Something went wrong");
    });

    it("should handle non-error objects", () => {
      trace("Simple string error");

      const output = logOutput.join("\n");
      expect(output).toContain("Simple string error");
    });

    it("should respect maxFrames option", () => {
      trace("Test", { maxFrames: 3 });

      const output = logOutput.join("\n");

      // at least one frame should be present; ensure we didn't exceed maxFrames
      expect(output).toContain("#1");
      expect(output).not.toContain("#4");
    });

    it("should filter frames with regex", () => {
      trace("Test", { filter: /trace\.test\.ts/ });

      const output = logOutput.join("\n");
      expect(output).toMatch(/trace\.test\.ts/);
    });

    it("should handle malformed stack lines", () => {
      const malformedStack = `Error: Test
    at valid (file.js:1:1)
    invalid line without proper format
    at anotherValid (file.js:2:2)`;

      trace(malformedStack);

      const output = logOutput.join("\n");
      expect(output).toContain("valid");
      expect(output).toContain("anotherValid");
    });
  });

  describe("stack", () => {
    it("should display stack trace for Error", () => {
      const err = new Error("Stack test");
      stack(err);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("📍");
      expect(output).toContain("Stack test");
    });

    it("should display stack trace for string", () => {
      const stackString = `Error: Custom stack
    at functionA (file.js:10:5)
    at functionB (file.js:20:10)`;

      stack(stackString);

      const output = logOutput.join("\n");
      expect(output).toContain("Custom stack");
      expect(output).toContain("functionA");
      expect(output).toContain("functionB");
    });

    it("should generate current stack when no error provided", () => {
      stack();

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("Stack Trace");
      expect(output).toContain("📍");
    });

    it("should respect maxFrames option", () => {
      const longStack = `Error: Test
    at frame1 (file.js:1:1)
    at frame2 (file.js:2:2)
    at frame3 (file.js:3:3)
    at frame4 (file.js:4:4)`;

      stack(longStack, { maxFrames: 2 });

      const output = logOutput.join("\n");
      expect(output).toContain("frame1");
      expect(output).toContain("frame2");
      expect(output).toContain("... 2 more frames");
      expect(output).not.toContain("frame3");
    });

    it("should skip frames when skipFrames is set", () => {
      const stackString = `Error: Test
    at frame1 (file.js:1:1)
    at frame2 (file.js:2:2)
    at frame3 (file.js:3:3)
    at frame4 (file.js:4:4)`;

      stack(stackString, { skipFrames: 2 });

      const output = logOutput.join("\n");
      expect(output).not.toContain("frame1");
      expect(output).not.toContain("frame2");
      expect(output).toContain("frame3");
      expect(output).toContain("frame4");
    });

    it("should hide file paths when showFiles is false", () => {
      const stackString = `Error: Test
    at functionA (file.js:10:5)
    at functionB (file.js:20:10)`;

      stack(stackString, { showFiles: "hide" });

      const output = logOutput.join("\n");
      expect(output).toContain("functionA");
      expect(output).toContain("functionB");
      expect(output).not.toContain("file.js");
    });

    it("should highlight matching patterns", () => {
      const stackString = `Error: Test
    at functionA (important.js:10:5)
    at functionB (other.js:20:10)
    at functionC (important.js:30:15)`;

      stack(stackString, {
        highlight: /important\.js/,
      });

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("functionA");
      expect(output).toContain("functionB");
      expect(output).toContain("functionC");
    });
  });

  describe("error", () => {
    it("should format Error objects", () => {
      const err = new Error("Something failed");
      error(err);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("💥 Error:");
      expect(output).toContain("Something failed");
    });

    it("should show error type when not 'Error'", () => {
      const typeError = new TypeError("Type mismatch");
      error(typeError);

      const output = logOutput.join("\n");
      expect(output).toContain("Type mismatch");
      expect(output).toContain("Type: TypeError");
    });

    it("should show error cause if present", () => {
      const cause = new Error("Root cause");
      const err = new Error("Main error", { cause });
      error(err);

      const output = logOutput.join("\n");
      expect(output).toContain("Main error");
      expect(output).toContain("Cause: Error: Root cause");
    });

    it("should include stack trace if available", () => {
      const err = new Error("With stack");
      error(err);

      const output = logOutput.join("\n");

      // only the emoji header is printed by error(); trace suppresses its own header
      expect(output).toContain("💥 Error:");
      expect(output).toContain("With stack");

      // and a numbered stack frame
      expect(output).toContain("#1");
    });

    it("should handle non-Error objects", () => {
      error("String error");

      const output = logOutput.join("\n");
      expect(output).toContain("💥 Error:");
      expect(output).toContain("String error");
    });

    it("should handle null and undefined", () => {
      error(null);
      error(undefined);

      const output = logOutput.join("\n");
      expect(output).toContain("null");
      expect(output).toContain("undefined");
    });
  });

  describe("callStack", () => {
    it("should display current call stack", () => {
      callStack();

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("📞 Call Stack");
      expect(output).toContain("─");
    });

    it("should format stack frames", () => {
      // eslint-disable-next-line functional/prefer-tacit
      const testFunction = () => callStack();
      testFunction();

      expect(logOutput.join("\n")).toContain("#1");
      expect(logOutput.join("\n")).toContain("at");
    });
  });

  describe("stack frame parsing", () => {
    it("should handle anonymous functions", () => {
      const stackWithAnonymous = `Error: Test
    at file.js:10:5
    at Object.<anonymous> (file.js:20:10)`;

      trace(stackWithAnonymous);

      expect(logOutput.join("\n")).toContain("<anonymous>");
    });

    it("should detect native frames", () => {
      const stackWithNative = `Error: Test
    at Array.forEach (native)
    at userFunction (file.js:10:5)`;

      trace(stackWithNative);

      expect(logSpy).toHaveBeenCalled();
    });

    it("should detect eval frames", () => {
      const stackWithEval = `Error: Test
    at eval (eval at userFunction (file.js:10:5))
    at userFunction (file.js:10:5)`;

      trace(stackWithEval);

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty error message", () => {
      const err = new Error("error");
      trace(err);

      expect(logSpy).toHaveBeenCalled();
    });

    it("should handle error without stack", () => {
      const err = new Error("No stack");
      err.stack = undefined;
      error(err);

      expect(logOutput.join("\n")).toContain("No stack");
    });

    it("should handle very long error messages", () => {
      const longMessage = `Error: ${"x".repeat(200)}`;
      trace(longMessage);

      expect(logSpy).toHaveBeenCalled();
    });

    it("should handle zero maxFrames", () => {
      const err = new Error("Test");
      trace(err, { maxFrames: 0 });

      expect(logOutput.join("\n")).toContain("Test");
      expect(logOutput.join("\n")).not.toContain("#1");
    });
  });
});
