export default {
  noName: () => "Each ReBars component should have a name",
  dataFn: ({ name } = {}) => `component:${name} must be a function`,
  tplStr: ({ name } = {}) => `component:${name} needs a template string`,
  propStomp: ({ name, key } = {}) => `component:${name} data.${key} was overrode by props`,
  propUndef: ({ name, key } = {}) => `component:${name} was passed undefined for prop "${key}"`,
  oneRoot: ({ name } = {}) => `component:${name} must have one root node, and cannot be a {{#watch}} block`,
  noEl: () => "$el must be present in the document",
  noHbs: () => "ReBars need Handlebars in order to run!",
  noMethod: ({ name, methodName } = {}) => `component:${name} does not have a method named "${methodName}"`,
  badPath: ({ path } = {}) => `${path} was not found in object`,
  warn(key, obj) {
    console.warn(this[key](obj));
  },
  fail(key, obj) {
    throw new Error(this[key](obj));
  },
};
