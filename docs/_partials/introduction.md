# ReBars
A simple alternative to modern Javascript frameworks that need pre-compiled, Babeled, and a Virtial DOM.

> If you have used Handlebars, you already know ReBars

The main concept of ReBars is a `{{#watch }}` block helper that lets you tell ReBars what and when to re-render.

```html
{{#watch "name.first" }}
  {{ name.first }}
{{/watch}}
```

Each time that `name.first` is changed, just that Handlebars block will re-render. No Virtial DOM patching, the block function from the helper is stored, and simply invoked again. Still interested? Cool, let's get to it...
