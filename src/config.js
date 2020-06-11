let isTracing = false;

export default {
  logLevel: () => (isTracing ? 1 : 0),
  setTrace: val => (isTracing = val),

  attrs: {
    watch: "rbs-watch",
    method: "rbs-method",
    ref: "rbs-ref",
  },
};
