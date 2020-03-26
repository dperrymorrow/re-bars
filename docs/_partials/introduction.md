

ReBars lets you re-render tiny pieces of your application on change. You are in control of what re-renders and when. There is no Virtual DOM, no JSX, no pre-compiling.

ReBars handles keeping your DOM in sync with your data, and gets out of your way. You can get back to just writing Javascript.

ReBars is really just Handlebars with some built in helpers and the notion of [components](component.html). The main concept of ReBars is a [{{#watch}}](helpers.html#watch) block helper that lets you tell ReBars what and when to re-render.

> If you have used Handlebars, you already know ReBars

```handlebars
<div>
{{#watch "name.first" }}
  {{ name.first }}
{{/watch}}
</div>
```

Each time the value passed to watch is changed, *just* that Handlebars block will re-render. No Virtial DOM patching, no re-render of entire template. The block function from the helper is stored at first render, and simply invoked again each time a value changes.
