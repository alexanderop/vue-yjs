import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  sourcemap: true,
  clean: true,
  format: ["cjs", "esm"],
  external: ["vue", "yjs", "y-protocols", "y-protocols/awareness", "y-websocket", "lib0"],
});
