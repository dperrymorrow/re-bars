import { terser } from "rollup-plugin-terser";
import strip from "rollup-plugin-strip";
import filesize from "rollup-plugin-filesize";
import gzipPlugin from "rollup-plugin-gzip";
import copy from "rollup-plugin-copy";

export default [
  {
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
        plugins: [terser(), gzipPlugin(), filesize()],
      },
    ],

    plugins: [
      strip(),
      copy({
        targets: [
          { src: "dist/index.module.min.js", dest: "docs/js", rename: "rebars.min.js" },
          { src: "dist/index.module.min.js.map", dest: "docs/js" },
        ],
      }),
    ],
  },
];
