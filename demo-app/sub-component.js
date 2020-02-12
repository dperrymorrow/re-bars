import Vbars from "../src/index.js";

export default Vbars.create({
  template: /*html*/ `
  <div>
    <textarea {{ bind "display" }}>{{ display }}</textarea>
    <p {{ watch "display" }}>{{ display }}</p>
  </div>
`,

  data: {
    display: "sup this is a sub component",
  },
});
