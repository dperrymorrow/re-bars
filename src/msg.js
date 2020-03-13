const styles = {
  warn: "background: #484915; color: #ffffbe; padding: .1em; font-weight: normal;",
  log: "background: #324645; color:#c9faff; padding: .1em; font-weight: normal;",
};

const _msg = (type, key, obj = {}, ...payloads) => {
  let str = messages[key](obj);
  if (["warn", "log"].includes(type)) {
    str = "%c " + str + " ";
    if (!window.ReBars.trace) return;
    if (payloads) {
      console.groupCollapsed(str, styles[type]);
      payloads.forEach(p => console.log(p));
      console.groupEnd();
    } else {
      console.log(str, styles[type]);
    }
  } else {
    if (payloads && window.rbs.trace) payloads.forEach(p => console.error(p));
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
  pathTrigger: ({ path, action, name }) => `component:${name} ${action} "${path}"`,
  triggered: ({ name, paths }) => `component:${name} data change ${paths.join(", ")}`,
  preRenderChange: ({ name, path }) =>
    `component:${name} set '${path}' before being added to the DOM. Usually caused by side effects from a hook or a data function`,
  focusFail: ({ ref, name }) =>
    `component:${name} ref "${ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each`,
  notKeyed: ({ name, path }) =>
    `component:${name} patching "${path}" add a {{ ref }} to avoid re-rendering the entire target`,
};

export default {
  messages,
  warn: _msg.bind(null, "warn"),
  fail: _msg.bind(null, "throw"),
  log: _msg.bind(null, "log"),
};
