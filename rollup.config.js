import { terser } from "rollup-plugin-terser";
// import strip from "rollup-plugin-strip";
import filesize from "rollup-plugin-filesize";
import gzipPlugin from "rollup-plugin-gzip";

export default [
  {
    input: "src/index.js",
    output: [
      { file: "dist/index.umd.js", format: "umd", name: "ReBars" },
      {
        file: "dist/index.umd.min.js",
        format: "umd",
        name: "ReBars",
        sourcemap: true,
        plugins: [terser(), gzipPlugin(), filesize()],
      },
    ],

    // plugins: [strip()],
  },
  {
    input: "src/index.js",
    output: [
      { file: "dist/index.module.js", format: "module", name: "ReBars" },
      {
        file: "dist/index.module.min.js",
        format: "module",
        name: "ReBars",
        sourcemap: true,
        plugins: [terser(), gzipPlugin()],
      },
    ],

    // plugins: [strip()],
  },

  // doc site rollups...
  {
    input: "docs/_src/docs.js",
    output: [
      {
        file: "docs/dist/docs.min.js",
        format: "umd",
        name: "DocsApp",
        plugins: [terser()],
      },
    ],
  },
];
