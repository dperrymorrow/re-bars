/* eslint-disable no-console */

const colors = {
  orange: "#ffc934",
  orangeDark: "#d38809",
  grey: "#073042",
  white: "#FFF",
  red: "#e95233",
  redDark: "#b74129",
  green: "#02d479",
  greenDark: "#0ea760",
  black: "#000000",
};

const emoj = {
  error: "💥",
  warn: "⚠️",
  log: "💬",
};

const styles = {
  msg: `background: ${colors.black}; color: ${colors.white}; font-weight: bold;`,
  warn: [
    `background: ${colors.orangeDark}; color:${colors.black}; font-weight: bold;`,
    `background: ${colors.orange}; color:${colors.black}; font-weight: bold;`,
  ],
  error: [
    `background: ${colors.redDark}; color:${colors.black}; font-weight: bold;`,
    `background: ${colors.red}; color:${colors.black}; font-weight: bold;`,
  ],
  log: [
    `background: ${colors.greenDark}; color:${colors.black}; font-weight: bold;`,
    `background: ${colors.green}; color:${colors.black}; font-weight: bold;`,
  ],
};

export default function(labels = "MSG") {
  const prefix = Array.isArray(labels) ? labels : [labels];

  const _render = (msg, msgType, data) => {
    msg = `${emoj[msgType]} ${msg}`;

    const message = prefix
      .slice(0, 2)
      .concat([msg])
      .map(str => `%c ${str} `)
      .join("");

    const colors = [styles[msgType][0]];
    if (prefix.length > 1) colors.push(styles[msgType][1]);
    colors.push(styles.msg);

    const args = [message].concat(colors);

    const method = data === null ? console.log : console.groupCollapsed;
    method(...args);
    if (data) {
      console.log(data);
      console.groupEnd();
    }
  };

  return {
    warn: (msg, data = null) => _render(msg, "warn", data),
    error: (msg, data = null) => _render(msg, "error", data),
    log: (msg, data = null) => _render(msg, "log", data),
  };
}
