import { terser } from "rollup-plugin-terser";
import strip from "rollup-plugin-strip";
import filesize from "rollup-plugin-filesize";
import gzipPlugin from "rollup-plugin-gzip";

export default {
  input: "src/index.js",
  output: [
    { file: "dist/index.js", format: "umd", name: "ReBars" },
    {
      file: "dist/index.min.js",
      format: "umd",
      name: "ReBars",
      sourcemap: true,
      plugins: [terser(), gzipPlugin(), filesize()],
    },
  ],

  plugins: [strip()],
};
