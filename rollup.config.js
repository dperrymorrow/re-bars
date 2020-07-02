import { terser } from "rollup-plugin-terser";
// import strip from "rollup-plugin-strip";
import filesize from "rollup-plugin-filesize";
import gzipPlugin from "rollup-plugin-gzip";
import copy from "rollup-plugin-copy";

export default [
  {
    input: "src/app.js",
    output: [
      { file: "dist/re-bars.umd.js", format: "umd", name: "ReBars" },
      {
        file: "dist/re-bars.umd.min.js",
        format: "umd",
        name: "ReBars",
        sourcemap: true,
        plugins: [
          terser(),
          gzipPlugin(),
          filesize(),
          copy({
            hook: "writeBundle",
            targets: [
              { src: "dist/re-bars.umd.min.js", dest: "docs/dist" },
              { src: "dist/re-bars.umd.min.js.map", dest: "docs/dist" },
            ],
          }),
        ],
      },
    ],

    // plugins: [strip()],
  },
  {
    input: "src/app.js",
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
];
