import Vbars from "../src/index.js";

export default Vbars.create({
  template: /*html*/ `
  <textarea {{ bind "display" }}>{{ display }}</textarea>
  <p {{ watch "display" }}>{{ display }}</p>
`,

  data: {
    display: "sup this is a sub component",
  },
});
