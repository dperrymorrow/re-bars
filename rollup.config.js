import { terser } from "rollup-plugin-terser";
import strip from "rollup-plugin-strip";

export default {
  input: "src/index.js",
  output: [
    { file: "dist/index.js", format: "umd", name: "Vbars" },
    {
      file: "dist/index.min.js",
      format: "umd",
      name: "Vbars",
      sourcemap: true,
      plugins: [terser()],
    },
  ],

  plugins: [strip()],
};
