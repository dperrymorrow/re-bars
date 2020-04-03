import { terser } from "rollup-plugin-terser";
// import strip from "rollup-plugin-strip";
import filesize from "rollup-plugin-filesize";
import gzipPlugin from "rollup-plugin-gzip";

export default [
  {
    input: "src/index.js",
    output: [
      { file: "dist/re-bars.umd.js", format: "umd", name: "ReBars" },
      {
        file: "dist/re-bars.umd.min.js",
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
      { file: "dist/re-bars.esm.js", format: "module", name: "ReBars" },
      {
        file: "dist/re-bars.esm.min.js",
        format: "module",
        name: "ReBars",
        sourcemap: true,
        plugins: [terser(), gzipPlugin(), filesize()],
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
