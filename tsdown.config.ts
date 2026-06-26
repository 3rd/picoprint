import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  outDir: "dist",
  platform: "node",
  target: "node22",
  treeshake: true,
  sourcemap: false,
  fixedExtension: false,
  outputOptions: {
    exports: "named",
  },
});
