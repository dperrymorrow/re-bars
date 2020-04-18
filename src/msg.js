const styles = {
  warn: "background: #484915; color: #ffffbe; padding: .1em; font-weight: normal;",
  log: "background: #324645; color:#c9faff; padding: .1em; font-weight: normal;",
};

const _getTplString = (template, { loc, data }) => {
  const lines = template.split("\n").slice(loc.start.line - 1, loc.end.line);
  const leadingSpaces = Array(lines[0].length - lines[0].trim().length).join(" ");
  lines[0] = lines[0].substr(loc.start.column);
  lines[lines.length - 1] = lines[lines.length - 1].substr(0, loc.end.column);
  return [
    "",
    `component: ${data.root.$name}, template line: ${loc.start.line}`,
    "============================================",
  ]
    .concat(lines.map(line => line.replace(leadingSpaces, "")))
    .join("\n");
};

const _msg = (type, key, obj = {}, ...payloads) => {
  let str = messages[key](obj);

  if (["warn", "log"].includes(type)) {
    str = "%c " + str + " ";
    // if (!window.ReBars.trace) return;
    if (payloads) {
      console.groupCollapsed(str, styles[type]);
      payloads.forEach(p => console.log(p));
      console.groupEnd();
    } else {
      console.log(str, styles[type]);
    }
  } else {
    payloads.forEach(p => console.error(p));
    throw new Error(str);
  }
};

const messages = {
  noEl: () => "$el must be present in the document",
  noHbs: () => "ReBars need Handlebars in order to run!",
  noName: () => "Each ReBars component should have a name",
  dataFn: ({ name }) => `${name}: must be a function`,
  tplStr: ({ name }) => `${name}: needs a template string`,
  propStomp: ({ name, key }) => `${name}: "data.${key}" was overrode by a prop`,
  propUndef: ({ name, key }) => `${name}: was passed undefined for prop "${key}"`,
  oneRoot: ({ name }) =>
    `${name}: must have one root node, and cannot be a {{#watch}} block. \nThis error can also be caused by malformed html.`,
  noMethod: ({ name, methodName }) => `${name}: does not have a method named "${methodName}"`,
  badPath: ({ path }) => `${path} was not found in object`,
  reRender: ({ name, path }) => `${name}: re-rendering "${path}"`,
  patching: ({ name, path }) => `${name}: patching ref Array "${path}"`,
  pathTrigger: ({ path, action, name }) => `${name}: ${action} "${path}"`,
  triggered: ({ name, paths }) => `${name}: data change "${paths}"`,

  paramUndef({ data, template, loc }) {
    return `component:${data.root.$name} passed undefined to a helper
      ${_getTplString(template, { data, loc })}
    `;
  },
  badWatchParam({ data, template, loc, path }) {
    return `${data.root.$name}: could not find "${path}" to watch. If primitve wrap in quotes
      ${_getTplString(template, { data, loc })}
    `;
  },
  noComp({ data, loc, template, cName }) {
    return `${data.root.$name}: child component "${cName}" is not registered
      ${_getTplString(template, { data, loc })}
    `;
  },
  restrictedKey: ({ name, key }) => `${name}: cannot use restricted key "${key}" in your data as it's a helper`,
  focusFail: ({ ref, name }) =>
    `${name}: ref "${ref}" is used more than once. Focus cannot be restored. If using bind, add a ref="uniqeName" to each`,
  notKeyed: ({ name, path }) =>
    `${name}: patching "${path}" add a {{ref 'someUniqueKey' }} to avoid re-rendering the entire Array`,
};

export default {
  messages,
  getStr: (key, obj) => messages[key](obj),
  warn: _msg.bind(null, "warn"),
  fail: _msg.bind(null, "throw"),
  log: _msg.bind(null, "log"),
};
