const styles = {
  warn: "background: #fff17a; color: black; padding: .1em; font-weight: normal;",
  log: "background: #349269; color:white; padding: .1em; font-weight: normal;",
};

const _msg = (type, key, obj = {}, payload) => {
  let str = messages[key](obj);
  if (["warn", "log"].includes(type)) {
    str = "%c " + str + " ";
    if (!window.ReBars.trace) return;
    if (payload) {
      console.groupCollapsed(str, styles[type]);
      console.log(payload);
      console.groupEnd();
    } else {
      console.log(str, styles[type]);
    }
  } else {
    if (payload && window.rbs.trace) console.error(payload);
    throw new Error(str);
  }
};

const messages = {
  noEl: () => "$el must be present in the document",
  noHbs: () => "ReBars need Handlebars in order to run!",
  noName: () => "Each ReBars component should have a name",
  dataFn: ({ name }) => `component:${name} must be a function`,
  tplStr: ({ name }) => `component:${name} needs a template string`,
  propStomp: ({ name, key }) => `component:${name} "data.${key}" was overrode by a prop`,
  propUndef: ({ name, key }) => `component:${name} was passed undefined for prop "${key}"`,
  oneRoot: ({ name }) => `component:${name} must have one root node, and cannot be a {{#watch}} block`,
  noMethod: ({ name, methodName }) => `component:${name} does not have a method named "${methodName}"`,
  badPath: ({ path }) => `${path} was not found in object`,
  reRender: ({ name, path }) => `component:${name} re-rendering "${path}"`,
  patching: ({ name, path }) => `component:${name} patching ref Array "${path}"`,
  focusFail: ({ ref, name }) =>
    `component:${name} ref "${ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each`,
};

export default {
  messages,
  warn: _msg.bind(null, "warn"),
  fail: _msg.bind(null, "throw"),
  log: _msg.bind(null, "log"),
};
