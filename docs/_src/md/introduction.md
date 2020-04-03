

# ReBars

A simple alternative to modern Javascript frameworks that need pre-compiled, Babeled, and a running Virtial DOM.

> ReBars is under 5k gzipped!

ReBars lets you re-render tiny pieces of your application on change. You are in control of what re-renders and when. There is no Virtual DOM, no JSX, no pre-compiling.

ReBars handles keeping your DOM in sync with your data, and gets out of your way. You can get back to just writing Javascript.

ReBars is really just Handlebars with some built in helpers and the notion of [components](#rebars-components). The main concept of ReBars is a [{{#watch}}](#the-watch-helper) block helper that lets you tell ReBars what and when to re-render.

> If you have used Handlebars, you already know ReBars

```javascript
template: /*html*/ `
  <h3>
    Button have been clicked
      {{#watch "clicked" }}
        {{ clicked }}
      {{/watch}}
    times
    <button {{ method "step" }}>Click Me</button>
  </h3>
`,

name: "counter",

data() {
  return { clicked: 0 };
},

methods: {
  step() {
    this.clicked ++;
  },
}
```

Each time the value passed to watch is changed, *just* that Handlebars block will re-render. No Virtial DOM patching, no re-render of entire template. The block function from the helper is stored at first render, and simply invoked again each time a value changes.
