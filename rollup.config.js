import { terser } from "rollup-plugin-terser";
import strip from "rollup-plugin-strip";
import filesize from "rollup-plugin-filesize";

export default {
  input: "src/index.js",
  output: [
    { file: "dist/index.js", format: "umd", name: "Vbars" },
    {
      file: "dist/index.min.js",
      format: "umd",
      name: "Vbars",
      sourcemap: true,
      plugins: [terser(), filesize()],
    },
  ],

  plugins: [strip()],
};
