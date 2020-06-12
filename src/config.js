let isTracing = false;

export default {
  logLevel: () => (isTracing ? 1 : 0),
  setTrace: val => (isTracing = val),

  regex: {
    attrs: /rbs-(.*?)="(.*?)"/g,
    whitespace: /\s/g,
  },

  attrs: {
    watch: "rbs-watch",
    method: "rbs-method",
    ref: "rbs-ref",
  },
};
