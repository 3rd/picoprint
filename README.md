# picoprint

A tiny, zero-dependency pretty printer for the terminal — tables, trees, boxes, diffs, colors, code, and calendars. Output is width-aware: ANSI escapes, CJK, and emoji are all measured correctly.

Requires Node.js 22+ or bun. `bat` is optional, for code syntax highlighting.

## Installation

```bash
bun add picoprint
# or
pnpm add picoprint
# or
npm install picoprint
```

## Importing

```typescript
// ESM / TypeScript
import p, { c } from 'picoprint';

// CommonJS
const p = require('picoprint');
const { c } = p;
```

Use `p` for the main API and `c` for colors, also available as `p.color` (or `p.c`). Every option and result type (`BoxOptions`, `TableOptions`, `TreeNode`, …) is exported from the package root for typed usage.

## Quick start

```typescript
import p, { c } from 'picoprint';

// pretty print any value (prints AND returns the string)
p({ name: 'Alice', age: 30, hobbies: ['reading', 'coding'] });

// colors
c.green.log('Success!');
c.bgRed.white.log('ERROR');

// log a line of values
p.log('server', 'listening on', 3000);

// capture output as a string instead of printing it
const output = p.format(() => {
  p.table([{ name: 'Alice' }, { name: 'Bob' }]);
  p.line('section');
});

const asyncOutput = await p.format(async () => {
  await p.box(async () => {
    p.log('loaded');
  });
});

// compose renderers inside a box, then print the box
p.box(() => {
  p.table([{ id: 1 }]);
  p.line();
}, { style: 'rounded', padding: 1 });

// p.indent() shifts everything printed after it, until p.dedent()
p.indent(2);
p.log('indented');
p.dedent();

// indent a single call instead, without touching global state
p.table([{ id: 1, status: 'ok' }], { offset: 2 });
```

## Features

- 🧩 **Pretty printing** - Values, Maps, Sets, and circular structures
- 🎨 **Rich formatting** - Chainable colors, backgrounds, styles, gradients, RGB/hex, and rainbow helpers
- 📦 **Box drawing** - Borders, titles, padding, panels, and backgrounds
- 📊 **Tables** - Arrays, plain objects, Maps, and side-by-side comparison
- 🌳 **Trees** - Tree rendering, object conversion, search/stats, and directory output
- 🔍 **Diffs** - Object diffs, word diffs, and side-by-side comparison
- 💻 **Code highlighting** - Line numbers and optional `bat` syntax highlighting
- 📅 **Calendars** - ascii calendars with event markers
- 🐛 **Stack traces** - Stack trace and rich error rendering
- 🔄 **Streaming** - Progressive output for boxes, tables, trees, and pretty printing
- 📝 **Logging and capture** - Global indentation, output capture, and styled `.log` chains

## 🎨 Colors and styling

```typescript
// basic colors
c.red('Error');
c.green('Success');
c.yellow('Warning');
c.bgBlue.white('Highlighted');

// modifiers
c.bold('Bold');
c.bold.yellow('Bold yellow');
c.dim('Dimmed');
c.italic('Italic');
c.underline('Underlined');
c.strikethrough('Strikethrough');

// 256 colors
c.color256(196)('Red from 256 palette');
c.bgColor256(226)('Yellow background');

// RGB & hex
c.rgb(255, 128, 0)('Orange');
c.hex('#FF5733')('Coral');
c.bgRgb(0, 0, 255)('Blue background');
c.bgHex('#2E86AB')('Ocean background');

// gradients and palettes
c.gradient('Smooth gradient text', c.red, c.blue);
c.gradientRgb('RGB gradient', { r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 });
c.gradientHex('Hex gradient', '#FF0000', '#0000FF');
c.rainbow('Rainbow text');
c.palette('#FF0000', 7); // 7 shades, returns string[]

// logging with styles
c.yellow.log('warn:', 'disk', 95, '%');
c.bold.yellow.log('ready');
```

Use the named export `c` for color functions and chains.

## 📦 Boxes

```typescript
p.box('Content here');

// styled boxes; styles: single, double, rounded, thick, ascii, and more
p.box('Double border', { style: 'double', borderColor: c.green });
p.box('Rounded box', { style: 'rounded', title: 'Info', borderColor: c.cyan });

// panel: rounded box with padding; title goes in options
p.box.panel('Panel content', { title: 'Title' });

// capture picoprint output inside the box; returns the rendered box string
const output = p.box(() => {
  p.log('Computing...');
  return 42;
}, { title: 'Process' });
// output includes "Computing..." inside the box

// background fill
p.box('Blue background', {
  background: c.bgBlue,
  padding: 1,
  borderColor: c.white,
});
```

## ➖ Lines

```typescript
p.line();                       // full-width rule
p.line('Section Title');        // rule with label
p.line({ style: 'double' });

// shortcuts
p.line.double('Double Line');
p.line.thick('Thick Line');
p.line.dashed('Dashed');
p.line.section();
p.line.section('Section');

// gradient rule
p.line.gradient({ start: c.magenta, end: c.yellow });

// label alignment
p.line({ label: 'Left', labelAlign: 'left' });
p.line({ label: 'Right', labelAlign: 'right', labelColor: c.cyan });
```

## 📊 Tables

```typescript
// array of objects
p.table([
  { name: 'Alice', age: 30, city: 'New York' },
  { name: 'Bob', age: 25, city: 'London' },
]);

// plain object as key-value pairs
p.table({ host: 'localhost', port: 3000, secure: true });

// Map
p.table(new Map([['key1', 'value1'], ['key2', 'value2']]));

p.table(data, {
  style: 'double',
  showIndex: true,
  columns: ['name', 'age'],
  align: { age: 'right', name: 'left' },
  compact: true,
  maxWidth: 20,
});

// side-by-side comparison
p.table.compare(
  { port: 3000, host: 'localhost' },
  { port: 8080, host: '0.0.0.0' },
);
```

`p.table()` accepts arrays, plain objects, and `Map`. Array-of-object tables infer columns from all rows unless you pass `columns` explicitly. Arbitrary object instances such as `Date`, `RegExp`, `Set`, and `Promise` are rejected as top-level table records instead of rendering as empty key/value tables. `p.table.compare()` accepts `TableCompareOptions`, which reuses table layout options except `columns`; compare output always owns its `key`, `left`, `right`, and `match` columns.

## 🌳 Trees

```typescript
const node = {
  name: 'root',
  children: [
    { name: 'branch1' },
    { name: 'branch2', children: [{ name: 'leaf1' }, { name: 'leaf2' }] },
  ],
};
p.tree(node);

// styles: single (default), thick, rounded, double, ascii
p.tree(node, { style: 'rounded', maxDepth: 3, showValues: true });

// convert a plain object to a tree
p.tree.fromObject({ user: { name: 'Alice', settings: { theme: 'dark' } } }, 'Config');
p.tree.fromObject({ user: { name: 'Alice' } }, { showValues: false });
p.tree.fromObject(cyclicObject); // circular references render as [Circular]

// search, stats, multiple trees
p.tree.search(node, 'leaf');
p.tree.search(node, 'false'); // searches node names and defined values, including false/0/null
p.tree.search(node, 'leaf', { filter: (entry) => entry.metadata?.visible !== false });
p.tree.stats(node, { offset: 2 });
p.tree.multi([node, node]);
p.tree.multi([node, undefined, node]); // undefined entries are skipped and visible trees are numbered in order

// directory rendering
p.tree.directory({
  name: 'src',
  type: 'directory',
  children: [
    { name: 'index.ts', type: 'file', size: 2048 },
    { name: 'components', type: 'directory', children: [{ name: 'Button.tsx', type: 'file', size: 1024 }] },
  ],
}, { fileIcons: true, showSizes: true, showPaths: true, sortBy: 'type' });
```

Tree-family option bags, tree node metadata, and directory entries must be plain objects; object instances such as `Date` and `RegExp` are rejected instead of treated as empty shapes. Explicit `TreeNode` and `DirectoryEntry` inputs must be acyclic trees; cyclic structures throw stable `picoprint ... circular reference` errors instead of overflowing the stack.

## 💻 Code highlighting

```typescript
p.code('const x = 42;', 'javascript');

p.code(sourceCode, {
  language: 'typescript',
  lineNumbers: true,
  frame: 'rounded',          // border style around the code
  title: 'Example',
  titleAlign: 'center',
  padding: 1,
  borderColor: c.yellow,
  titleColor: c.cyan,
});

// bat integration is off by default; enable it explicitly
p.configure({ code: { useBat: true, batTheme: 'TwoDark' } });
```

## 🔍 Diffs

```typescript
// visual object diff
p.diff(
  { name: 'Alice', age: 30 },
  { name: 'Alice', age: 31, city: 'NYC' },
);
p.diff(obj1, obj2, { showUnchanged: true, compact: false, maxDepth: 3 });

// word-level diff
p.diff.words('Hello world', 'Hello beautiful world');
p.diff.words(text1, text2, { ignoreCase: true, ignoreWhitespace: true });

// side-by-side comparison
p.diff.compare(leftData, rightData, { labels: ['Dev', 'Prod'] });

// structural diff as data (no printing)
const changes = p.diff.nodes(obj1, obj2);
// [{ type: 'modified', path: ['age'], pathSegments: [{ kind: 'key', key: 'age' }], key: 'age', value1: 30, value2: 31 }, ...]
```

`p.diff.words()` uses sequence matching, so inserted words do not make shifted unchanged words look deleted and re-added. `p.diff.nodes()` compares built-in values such as `Date`, `RegExp`, `Error`, `Map`, and `Set` instead of treating them as empty plain objects.

Diff nodes include display `path: string[]` and typed `pathSegments` so object keys such as `"[0]"` are distinguishable from array indexes.

## 📅 Calendar

```typescript
p.calendar();                      // current month
p.calendar(new Date(2024, 2));     // March 2024
p.calendar({ showHeader: true });  // current month with options

p.calendar(date, {
  showHeader: true,                // off by default
  showWeekNumbers: true,
  firstDayOfWeek: 0,               // 0=Sunday, 1=Monday (default)
  events: [
    { date: new Date(2024, 2, 15), label: 'Meeting', color: c.red, priority: 'high' },
  ],
});
```

## 🔄 Streaming

```typescript
// table rows as they arrive
const rows = p.stream.table({ columns: ['id', 'status'] });
rows.row({ id: 1, status: 'pending' });
rows.row({ id: 2, status: 'complete' });
rows.close();

// tree nodes with explicit nesting
const nodes = p.stream.tree();
nodes.enter('node1');
nodes.node('child');
nodes.kv('size', 42);
nodes.leave();
nodes.close();

const customNodes = p.stream.tree({
  bullet: '-',
  indent: '  ',
  colors: {
    node: c.cyan,
    value: c.yellow,
    connector: c.gray,
  },
});
customNodes.enter('');
customNodes.node('blank parent label is still printed');
customNodes.close();

// boxed lines
const lines = p.stream.box({ title: 'Live Data' });
lines.writeln('Line 1');
lines.writeln('Line 2');
lines.close();

// pretty-printed values
const values = p.stream.pp();
values.value({ data: 'value' });
values.text('done');
values.close();
```

- Stream handles print incrementally as you call their methods, and `close()` is idempotent — calls that would write after `close()` are ignored.
- Stream constructor options must be plain objects; open-stream method arguments are validated before writing.
- `p.stream.table()` requires a non-empty `columns: string[]` and object rows.
- `p.stream.box()` and `p.stream.table()` honor the global `style` and `compact` defaults.
- `p.stream.tree()` accepts `bullet`, `indent`, `colors.node/value/connector`, `offset`, and `renderContext`. `enter('')` prints an empty-label node; `enter()` with no argument only increases depth.

## 🐛 Stack traces

```typescript
try {
  someFunction();
} catch (err) {
  p.trace.error(err, { offset: 2 }); // rich error: message, type, cause, trace
  p.trace(err);        // stack trace with framing
}

p.trace.callStack();   // current call stack
p.trace.callStack({ maxFrames: 3, showFiles: 'hide' }); // current stack with stack options
p.trace.stack();       // compact stack
p.trace.stack({ maxFrames: 3, showFiles: 'hide' }); // current stack with options
```

When a first argument is supplied to `p.trace.stack()`, it must be an `Error`, a stack string, or an options object.

`filter` and `highlight` accept `RegExp`; global regexes are treated statelessly so `lastIndex` does not skip frames or mutate caller state.

## 📝 Printing and layout

Every batch renderer prints to the terminal **and** returns the rendered string, so you can use the returned value or ignore it.

| Call | Prints | Returns |
| --- | --- | --- |
| `p(value)`, `p.log(...)`, and string-content renderers | yes | rendered string |
| `p.box(() => ...)` and `p.box.panel(..., () => ...)` | yes | rendered string, or `Promise<string>` for async callbacks |
| `p.format(() => ...)` | no | captured rendered string, or `Promise<string>` for async callbacks |
| `p.stream.box/table/tree/pp(...)` | yes, incrementally as you call its methods | stream handle |
| `p.tree.stats(node, options?)` | yes | `TreeStatsResult` with `output` containing the rendered summary |
| `p.diff.nodes(a, b)` | no | `DiffNode[]` |

Callback boxes capture output produced by picoprint calls such as `p.log`, `p.table`, and `p.tree`. They do not capture native `console.log`. Await callback boxes and panels when the callback is async.

### Indentation and offset

`p.indent(n?)` / `p.dedent()` manage a global left indent that applies to every following call, so output from different functions lines up. Each `p.indent(n)` adds `n` spaces (default 2); each `p.dedent()` removes the last level.

`offset` does the same for a single call, without touching global state. It indents that call's **entire** output — every line of a box, table, tree, or diff — and shrinks the render width to fit:

```typescript
p.box('nested', { offset: 4 });
p.table(rows, { offset: 4 }); // every row is indented 4 spaces
```

`offset: n` is the same as `p.indent(n)` … `p.dedent()` around a single call, with no indent stack to balance.

Use `p.createContext()` / `renderContext` only when you need explicit width and offset control.

### Width

- `p.box()`, framed `p.code()`, and `p.stream.box()` clamp an **auto-derived** width (from the terminal, an offset, or a render context) up to the minimum needed to fit both borders, padding, and one content column.
- An **explicitly** requested `width` that is too small throws instead of clamping.
- Framed code with line numbers throws when there is no room for the line-number gutter.

## ⚙️ Global configuration

```typescript
p.configure({
  // cross-module defaults
  defaults: {
    style: 'rounded',  // default border/line style
    compact: true,     // default compact mode for pp
    maxDepth: 5,       // default max depth for pp
  },
  // code rendering
  code: {
    useBat: true,
    batTheme: 'TwoDark',
    batOptions: [],
  },
});

const config = p.getConfig();
p.resetConfig();
```

`p.configure()` takes `ConfigureOptions`, so TypeScript callers must pass at least one top-level config section. Runtime validation still catches JavaScript misuse: `defaults.compact` and `code.useBat` must be booleans, `defaults.maxDepth` must be a non-negative integer, `code.batTheme` must be a string, and `code.batOptions` must be `string[]`. `p.getConfig()` returns a snapshot, so mutating returned arrays does not change global config.

## API summary

The default export `p` is both a function and an object:

- `p(value, options?)` — pretty print any value; options: `{ maxDepth?, compact?, offset? }`
- `p.log(...args)` — print args and return the rendered string, including indentation
- `c.*` — chainable colors; `.log(...args)` on any chain
- `p.box(content | fn, options?)`, `p.box.panel(content | fn, options?)`; async callbacks return `Promise<string>`
- `p.line(labelOrOptions?)` and `p.line.*` shortcuts; use `labelColor` to style labels
- `p.table(data, options?)`, `p.table.compare(left, right)`
- `p.tree(node, options?)` and `p.tree.fromObject/multi/search/stats/directory`
- `p.code(source, languageOrOptions?)`; use `frame: boolean | LineStyleName` for bordered code
- `p.diff(a, b, options?)`, `p.diff.words(a, b, options?)`, `p.diff.compare(a, b, options?)`, `p.diff.nodes(a, b)`
- `p.calendar(options?)` or `p.calendar(date?, options?)`
- `p.trace(err, options?)`, `p.trace.stack(options?)` or `p.trace.stack(err?, options?)`, `p.trace.error(err, options?)`, and `p.trace.callStack(options?)` with `StackOptions`
- `p.stream.box/table/tree/pp`
- `p.format(fn)` — capture picoprint output produced by `fn`, print nothing; async callbacks return `Promise<string>`
- `p.indent(amount?)` / `p.dedent()` — global indentation; each `indent` pushes one level (default 2 spaces), each `dedent` pops one level
- `p.configure(options)` / `p.getConfig()` / `p.resetConfig()`
- Most renderers accept `offset?: number` to indent that one call's whole output; use `p.createContext(offset?)` for advanced render context control

## Troubleshooting

- **No colors:** picoprint respects terminal color support. Check `NO_COLOR`, `TERM=dumb`, and whether stdout is a TTY.
- **Invalid style option:** style options use finite names such as `single`, `rounded`, `double`, `thick`, and `ascii`. Unknown style strings throw a stable `TypeError`.
- **Invalid layout, helper argument, or data shape:** option bags and nested record options such as table `align` must be plain objects unless a documented string shorthand is allowed. Widths, padding, offsets, render contexts, indent amounts, booleans, alignment names, gradient line options, line separator objects, table columns, table rows, table data records, table comparison objects, diff labels, code sources and titles, diff word inputs, trace regex options, stream method arguments, tree nodes, tree metadata, directory entries, and calendar events are validated before rendering. `p.format()` requires a callback.
- **Invalid color option:** renderer color options expect functions, not strings. `borderColor`, `titleColor`, and `labelColor` accept functions such as `c.cyan`.
- **Invalid background option:** `background` expects a background function such as `c.bgBlue`, not a foreground function like `c.blue`.
- **Invalid color helper input:** `color256`, `bgColor256`, `rgb`, `bgRgb`, `hex`, `bgHex`, `gradient`, `gradientRgb`, `gradientHex`, `rainbow`, and `palette` validate their text, color, channel, hex, and count inputs before checking terminal color support.
- **Invalid calendar event:** `events` must be an array of `{ date: Date, label: string }`; event colors must be foreground color functions.
- **Invalid config:** `p.configure()` validates section objects and field types before storing global defaults.
- **Code is not syntax highlighted by `bat`:** `bat` is disabled by default. Install `bat` on `PATH` and enable it with `p.configure({ code: { useBat: true } })`. If `bat` is unavailable, picoprint falls back to plain code rendering.
