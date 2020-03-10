export default {
  noName: () => "Each ReBars component should have a name",
  dataFn: ({ name } = {}) => `component:${name} must be a function`,
  tplStr: ({ name } = {}) => `component:${name} needs a template string`,
  propStomp: ({ name, key } = {}) => `component:${name} data.${key} was overrode by props`,
  propUndef: ({ name, key } = {}) => `component:${name} was passed undefined for prop "${key}"`,
  oneRoot: ({ name } = {}) => `component:${name} must have one root node, and cannot be a {{#watch}} block`,
  warn(key, obj) {
    console.warn(this[key](obj));
  },
  fail(key, obj) {
    throw new Error(this[key](obj));
  },
};
