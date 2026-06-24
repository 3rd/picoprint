# picoprint examples

These files are runnable source demos for this repository. They import from `@/.` so they exercise the current TypeScript source without requiring a build.

When copying a snippet into an installed package consumer, use the package import instead:

```ts
import p, { c } from "picoprint";
```

The example code itself follows the public `p.*` API and canonical option names.
