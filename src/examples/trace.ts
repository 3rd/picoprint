import p from "@/.";
import { printExample } from "./_helpers";

// Basic examples
printExample("Basic Examples", [
  {
    title: "Simple error trace",
    handler: () => {
      const simpleError = new Error("Something went wrong!");
      p.trace(simpleError);
    },
  },
  {
    title: "Limited frames",
    handler: () => {
      const deepError = new Error("Deep call stack error");
      p.trace(deepError, { maxFrames: 5 });
    },
  },
  {
    title: "String stack trace",
    handler: () => {
      const stringStack = `Error: Database connection failed
    at connect (db.js:45:11)
    at initialize (app.js:23:5)
    at main (index.js:10:3)
    at Object.<anonymous> (index.js:50:1)`;
      p.trace(stringStack);
    },
  },
  { title: "Non-error object", handler: () => p.trace("Simple string error message") },
]);

// Options
printExample("Stack Trace Options", [
  { title: "Current stack trace", handler: () => p.stack() },
  {
    title: "Custom options",
    handler: () => {
      p.stack(undefined, {
        maxFrames: 3,
        showFiles: "show",
      });
    },
  },
  {
    title: "Skip frames",
    handler: () => {
      const skipError = new Error("Skip some frames");
      p.stack(skipError, {
        skipFrames: 2,
        maxFrames: 5,
      });
    },
  },
  {
    title: "Hide file paths",
    handler: () => {
      const noFilesError = new Error("Hide file paths");
      p.stack(noFilesError, {
        showFiles: "hide",
        maxFrames: 5,
      });
    },
  },
]);

// Error formatting
printExample("Error Formatting", [
  {
    title: "Standard Error",
    handler: () => {
      const standardError = new Error("Standard error message");
      p.error(standardError);
    },
  },
  {
    title: "TypeError",
    handler: () => {
      const typeError = new TypeError("Cannot read property 'foo' of undefined");
      p.error(typeError);
    },
  },
  {
    title: "RangeError",
    handler: () => {
      const rangeError = new RangeError("Maximum call stack size exceeded");
      p.error(rangeError);
    },
  },
  {
    title: "Error with cause",
    handler: () => {
      const rootCause = new Error("Database unavailable");
      const wrappedError = new Error("Failed to fetch user data", { cause: rootCause });
      p.error(wrappedError);
    },
  },
  {
    title: "Non-Error values",
    handler: () => {
      p.error("String error");
      p.error(404);
      p.error({ message: "Object error", code: "ERR_001" });
    },
  },
]);

// Call stack
printExample("Call Stack", [
  { title: "Current call stack", handler: () => p.callStack() },
  {
    title: "Nested function stack",
    handler: () => {
      const level3 = () => {
        p.callStack();
      };
      const level2 = () => {
        level3();
      };
      const level1 = () => {
        level2();
      };
      level1();
    },
  },
]);

// Filtering
printExample("Filtering Stack Traces", [
  {
    title: "Filter with regex",
    handler: () => {
      const mixedStack = `Error: Mixed sources
    at userFunction (app.js:10:5)
    at nodeModule (node_modules/library/index.js:234:12)
    at anotherUserFunction (app.js:25:8)
    at internal (node:internal/modules/cjs/loader:1234:19)
    at finalUserFunction (app.js:40:3)`;

      p.trace(mixedStack, {
        filter: /app\.js/,
      });
    },
  },
  {
    title: "Filter out node_modules",
    handler: () => {
      const mixedStack = `Error: Mixed sources
    at userFunction (app.js:10:5)
    at nodeModule (node_modules/library/index.js:234:12)
    at anotherUserFunction (app.js:25:8)
    at internal (node:internal/modules/cjs/loader:1234:19)
    at finalUserFunction (app.js:40:3)`;

      p.trace(mixedStack, {
        filter: /^(?!.*node_modules).*$/,
      });
    },
  },
]);

// Highlighting
printExample("Stack Highlighting", [
  {
    title: "Highlight files",
    handler: () => {
      const stackForHighlight = `Error: Important error
    at criticalFunction (critical.js:15:7)
    at helperFunction (utils.js:45:12)
    at anotherCritical (critical.js:28:9)
    at regularFunction (app.js:100:5)`;

      p.stack(stackForHighlight, {
        highlight: /critical\.js/,
        showFiles: "show",
      });
    },
  },
]);

// Nested errors
printExample("Nested Errors", [
  {
    title: "Chain of errors",
    handler: () => {
      const level1Error = new Error("Low level: File not found");
      const level2Error = new Error("Mid level: Config loading failed", { cause: level1Error });
      const level3Error = new Error("High level: Application startup failed", { cause: level2Error });

      p.error(level3Error);
    },
  },
]);
