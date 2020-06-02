let trace = true;

const styles = {
  warn: "background: #484915; color: #ffffbe; padding: .1em; font-weight: normal;",
  log: "background: #324645; color:#c9faff; padding: .1em; font-weight: normal;",
};

const _showTpl = ({ template, loc }) => {
  const lines = template.split("\n").slice(loc.start.line - 1, loc.end.line);
  const leadingSpaces = Array(lines[0].length - lines[0].trim().length).join(" ");
  const trimmed = lines.map(line => line.replace(leadingSpaces, "      "));
  trimmed[0] = `>>>> ${trimmed[0].trim()}`;

  return `
  template line: ${loc.start.line}
  ============================================
  ${trimmed.join("\n")}
  `;
};

const _msg = (type, msg, ...payloads) => {
  let str = `ReBars: ${msg}`;
  if (typeof payloads[0] === "object" && "template" in payloads[0] && "loc" in payloads[0]) {
    str += _showTpl(payloads[0]);
    payloads.splice(0, 1);
  }

  if (["warn", "log"].includes(type)) {
    str = "%c " + str + " ";
    if (!trace) return;
    if (payloads) {
      console.groupCollapsed(str, styles[type]);
      payloads.forEach(console.log);
      console.groupEnd();
    } else {
      console.log(str, styles[type]);
    }
  } else {
    payloads.forEach(console.error);
    throw new Error(str);
  }
};

export default {
  setTrace: val => (trace = val),
  warn: _msg.bind(null, "warn"),
  fail: _msg.bind(null, "throw"),
  log: _msg.bind(null, "log"),
};
