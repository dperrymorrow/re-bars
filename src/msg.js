let trace = true;
const offset = 5;

const styles = {
  warn: "background: #484915; color: #ffffbe; padding: .1em; font-weight: normal;",
  log: "background: #324645; color:#c9faff; padding: .1em; font-weight: normal;",
};

const _showTpl = ({ template, loc }) => {
  const errIndex = loc.start.line - 1;
  const lines = template.split("\n");
  lines[errIndex] += `\n${Array(loc.start.column + 1).join("-")}^`;
  const trace = lines.slice(loc.start.line - offset, loc.end.line + offset);

  return ["", `template line ${loc.start.line}`, "============================================"]
    .concat(trace)
    .join("\n");
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
