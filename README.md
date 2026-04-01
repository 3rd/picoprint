# picoprint

A tiny, fast, and feature-rich pretty printer for the terminal with zero dependencies.

## Installation

```bash
bun add picoprint
# or
pnpm add picoprint
# or
npm install picoprint
```

## Quick Start

```typescript
import p, { c } from 'picoprint';

// pretty print any value (prints AND returns string)
p({ name: 'Alice', age: 30, hobbies: ['reading', 'coding'] });

// colors
c.green.log('Success!');
c.bgRed.white.log('ERROR');

// quick logging (indent-aware)
p.log('server', 'listening on', 3000);

// capture output as string without printing
const output = p.format(() => {
  p.table([{ name: 'Alice' }, { name: 'Bob' }]);
  p.line('section');
  p.tree(myTree);
});

// compose with callbacks
p.box(() => {
  p.table(data);
  p.line();
  p.tree(node);
}, { style: 'rounded', padding: 1 });

// indentation persists across call sites
p.indent(2);
p.log('indented');
p.dedent();
```

## Features

- 🎨 **Rich formatting** - Colors, backgrounds, styles, gradients
- 📦 **Box drawing** - Multiple border styles with padding and titles
- 📊 **Tables** - Auto-formatted tables from arrays and objects
- 🌳 **Trees** - Hierarchical tree structures with search
- 🔍 **Diffs** - Visual object and text diffs
- 💻 **Code highlighting** - Syntax highlighting with optional bat integration
- 📅 **Calendars** - ASCII calendars with event markers
- 🔄 **Streaming** - Streaming output for progressive rendering
- 📝 **Logging** - `p.log` and chainable `.log` on colors (e.g., `p.color.yellow.log()`)

### 🎨 Colors & Styling

```typescript
// Basic colors
p.color.red('Error'), p.color.green('Success'), p.color.yellow('Warning')
p.color.bgBlue.white('Highlighted')

// Modifiers
p.color.bold('Bold'), p.color.dim('Dimmed'), p.color.italic('Italic')
p.color.underline('Underlined'), p.color.strikethrough('Strikethrough')

// 256 colors
p.color.color256(196)('Red from 256 palette')
p.color.bgColor256(226)('Yellow background')

// RGB & Hex
p.color.rgb(255, 128, 0)('Orange')
p.color.hex('#FF5733')('Coral')
p.color.bgRgb(0, 0, 255)('Blue background')
p.color.bgHex('#2E86AB')('Ocean background')

// Gradients
p.color.gradient('Smooth gradient text', p.color.red, p.color.blue)
p.color.gradientRgb('RGB gradient', {r:255,g:0,b:0}, {r:0,g:0,b:255})
p.color.gradientHex('Hex gradient', '#FF0000', '#0000FF')

// Rainbow & color palettes
p.color.rainbow('Rainbow text 🌈')
p.color.palette('#FF0000', 7) // Generate 7 shades

// Logging with styles
p.color.yellow.log('warn:', 'disk', 95, '%')
p.color.bold.yellow.log('ready')
// plain log
p.log('status', 200)
```

### 📦 Boxes

```typescript
// Basic box
p.box('Content here');

// Styled boxes
p.box('Double border', { style: 'double', borderColor: p.color.green });
p.box('Rounded box', { style: 'rounded', title: 'Info', borderColor: p.color.cyan });

// Box styles: single, double, rounded, thick, ascii

// Box variants
p.box('No padding frame', { borderColor: p.color.red });
p.box.panel('Title', 'Panel content with rounded corners');

// Capture console output
p.box(() => {
  console.log('This output is captured');
  console.log(p.color.green('With colors!'));
}, { title: 'Captured', style: 'rounded' });

// Box returns callback's return value
const result = p.box(() => {
  console.log('Computing...');
  return 42;
}, { title: 'Process' });
// result === 42

// Background colors
p.box('Blue background', {
  background: p.color.bgBlue,
  padding: 1,
  borderColor: p.color.white
});
```

### ➖ Lines

```typescript
// Simple line
p.line();

// Line with label
p.line('Section Title');

// Line styles
p.line({ style: 'double' });
p.line({ style: 'thick' });
p.line({ style: 'dashed' });

// Shortcuts
p.line.double('Double Line');
p.line.thick('Thick Line');
p.line.dashed('Dashed');
p.line.section('Section');

// Gradient line
p.line.gradient({ start: p.color.magenta, end: p.color.yellow });

// Custom alignment
p.line({ label: 'Left', labelAlign: 'left' });
p.line({ label: 'Right', labelAlign: 'right' });
```

### 📊 Tables

```typescript
// Array of objects
p.table([
  { name: 'Alice', age: 30, city: 'New York' },
  { name: 'Bob', age: 25, city: 'London' }
]);

// Object as key-value pairs
p.table({ host: 'localhost', port: 3000, secure: true });

// Map
p.table(new Map([['key1', 'value1'], ['key2', 'value2']]));

// Table options
p.table(data, {
  style: 'double',      // single, double, rounded, thick, ascii
  showIndex: true,      // Show row numbers
  columns: ['name', 'age'], // Select columns
  align: { price: 'right', name: 'left' },
  compact: true,
  maxWidth: 20
});

// Compare two objects side-by-side
p.table.compare(
  { port: 3000, host: 'localhost' },
  { port: 8080, host: '0.0.0.0' }
);
```

### 🌳 Trees

```typescript
// Basic tree
const tree = {
  name: 'root',
  children: [
    { name: 'branch1' },
    {
      name: 'branch2',
      children: [
        { name: 'leaf1' },
        { name: 'leaf2' }
      ]
    }
  ]
};
p.tree(tree);

// Tree styles: unicode, ascii, rounded, double, bold

// Tree with values & metadata
p.tree(tree, {
  showValues: true,
  showMetadata: true,
  maxDepth: 3,
  style: 'rounded'
});

// Convert object to tree
p.tree.fromObject({
  user: { name: 'Alice', settings: { theme: 'dark' } }
}, 'Config');

// Search in tree
p.tree.search(tree, 'leaf');

// Tree statistics
p.tree.stats(tree);

// Multiple trees
p.tree.multi([tree1, tree2, tree3]);

// Directory structure
const dir = {
  name: 'src',
  type: 'directory',
  children: [
    { name: 'index.ts', type: 'file', size: 2048 },
    {
      name: 'components',
      type: 'directory',
      children: [
        { name: 'Button.tsx', type: 'file', size: 1024 }
      ]
    }
  ]
};
p.tree.directory(dir, {
  fileIcons: true,
  showSizes: true,
  sortBy: 'type' // or 'name', 'size'
});
```

### 💻 Code Highlighting

```typescript
// Basic syntax highlighting (uses bat if available)
p.code('const x = 42;', 'javascript');

// Code with options
p.code(sourceCode, {
  language: 'typescript',
  lineNumbers: true,
  window: 'rounded',      // Window border style
  title: 'Example',
  titleAlign: 'center',
  padding: 1,
  background: p.color.bgBlue,
  borderColor: p.color.yellow,
  titleColor: p.color.cyan
});

// Configure bat integration
p.configure({
  code: {
    useBat: true,
    batTheme: 'TwoDark'
  }
});
```

### 🔍 Diffs

```typescript
// Object diff
p.diff(
  { name: 'Alice', age: 30 },
  { name: 'Alice', age: 31, city: 'NYC' }
);

// Options
p.diff(obj1, obj2, {
  showUnchanged: true,
  compact: false,
  maxDepth: 3
});

// Word diff
p.diff.words('Hello world', 'Hello beautiful world');
p.diff.words(text1, text2, {
  ignoreCase: true,
  ignoreWhitespace: true
});

// Side-by-side comparison
p.diff.compare(leftData, rightData);
p.diff.compare(data1, data2, { labels: ['Dev', 'Prod'] });

// Deep diff (returns diff nodes)
const changes = p.diff.deep(obj1, obj2);
```

### 📅 Calendar

```typescript
// Current month
p.calendar();

// Specific date
p.calendar(new Date(2024, 2)); // March 2024

// With options
p.calendar(date, {
  showHeader: true,
  showFooter: true,
  showWeekNumbers: true,
  firstDayOfWeek: 0 // 0=Sunday, 1=Monday
});

// Calendar with events
p.calendar(new Date(), {
  events: [
    {
      date: new Date(2024, 2, 15),
      label: 'Meeting',
      color: p.color.red,
      priority: 'high'
    }
  ]
});
```

### 🔄 Streaming

```typescript
// Stream table data
const stream = p.stream.table();
stream.write({ id: 1, status: 'pending' });
stream.write({ id: 2, status: 'complete' });
stream.close();

// Stream tree nodes
const treeStream = p.stream.tree();
treeStream.add({ name: 'node1', path: [] });
treeStream.add({ name: 'child', path: ['node1'] });
treeStream.close();

// Stream boxes
const boxStream = p.stream.box({ title: 'Live Data' });
boxStream.writeln('Line 1');
boxStream.writeln('Line 2');
boxStream.close();

// Stream pretty printing
const ppStream = p.stream.pp();
ppStream.write({ data: 'value' });
ppStream.close();
```

### 🐛 Stack Traces

```typescript
// Enhanced error display
try {
  someFunction();
} catch (err) {
  p.trace.error(err);   // rich error: message, type/cause, trace
  p.trace(err);          // stack trace with framing
}

// Current call stack
p.trace.callStack();

// Compact stack
p.trace.stack();
```

### ⚙️ Configuration

```typescript
p.configure({
  // Global defaults (applied to all modules as fallback)
  defaults: {
    style: 'rounded',   // default border/line style
    compact: true,       // default compact mode for pp/table
    maxDepth: 5,         // default max depth for pp
  },

  // Code highlighting
  code: {
    useBat: true,        // use bat for syntax highlighting
    batTheme: 'TwoDark', // bat theme
    batOptions: []       // additional bat arguments
  }
});

// Get current config
const config = p.getConfig();

// Reset to defaults
p.resetConfig();
```

## API

The default export `p` is both a function and an object:

- `p(value, options?)` - Pretty print any value
- `p.color.{name}(text)` - All color functions (or `import { color as c }`)
- `p.log(...args)` - Print any args (indent-aware) and return string
- `p.color.{name}.log(...args)` - Chain colors then print args
- `p.box(content, options?)` - Draw boxes
- `p.line(options?)` - Draw lines
- `p.table(data, options?)` - Display tables
- `p.tree(node, options?)` - Display trees
- `p.code(code, options?)` - Syntax highlighting
- `p.diff(a, b, options?)` - Show differences
- `p.calendar(date?, options?)` - Display calendar
- `p.stream.*` - Streaming variants
- `p.indent(amount?)` - Increase global indent (default 2)
- `p.dedent()` - Decrease by one prior `p.indent` level
- And more...

Note on indentation levels: each call to `p.indent(amount?)` pushes one level by the specified space amount (default 2). `p.dedent()` removes exactly one prior level per call; call it repeatedly to pop multiple levels.

## Requirements

- Node.js 22+
- Optional: `bat` for enhanced syntax highlighting
