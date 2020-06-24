
# A ReBars Application

A ReBars application is a Handlebars template rendered to a specified DOM element. You can event have more than one app on a page if you desire.

## Getting Started

> You will need Handlebars in order to use ReBars. You can install it from NPM or use a CDN.

```html
<!-- Handlebars from CDN --->
<script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js"></script>
<!-- ReBars from CDN --->
<script src="https://cdn.jsdelivr.net/npm/re-bars@latest/dist/index.umd.min.js"></script>
```

Or using NPM

```shell
npm i --save-dev handlebars re-bars
```

```javascript
import Handlebars from "handlebars";
import ReBars from "re-bars";
```

## Creating an Application

To create an app, invoke the `Rebars.app` function with an Object describing your application.

```javascript
{
  Handlebars // Optional, Handlebars source, defaults to window.Handlebars
  template: ``, // The Handlebars template string
  data: {}, // data passed to your template
  helpers: {}, // Hanlebars helpers to add
  partials: {}, // Hanlebars partials to register
  trace: true, // If true logs changes and re-renders to the console
}
```

This will return an Object containing

- `instance` | `Object` the Handlebars instance the app is using
- `render` | `Function` the function

You then call `render` passing in the selector for a target element to render to.

```javascript
const app = ReBars.app(...your app definition);
app.render("#my-app");
```

## Custom Helpers

If you would like to add helpers to all components within this application you can pass a helpers Object to the `ReBars.app` function, You would then be able to use your `isChecked` helper in any component in your application. The helpers operate just as any other Handlebars helper you would add. `this` is the scope of the render block. [more about Handlebars helpers here](https://handlebarsjs.com/guide/#custom-helpers)

```javascript
ReBars.app({
  helpers: {
    isChecked(val) {
      console.log(this) // the scope of your template
      return val ? "checked" : "";
    },
  }
  ...
});
```

ReBars simply registers these helpers for you to the Handlebars instance of your app. Should you want to register more helpers yourself instead of defining them in your app definition, you can do so using the instanct returned from creating your app.

```javascript
const { instance } = ReBars.app(...);
instance.registerHelper("myCustomHelper", function () {
  // helper code...
})
```

## Handlebars

If you would like use Handlebars from a source other than `window`, you can pass your instance of Handlebars to the `ReBars.app` function. This can be helpful for test setup.

```javascript
import Handlebars from "somewhere";

ReBars.app({
  Handlebars,
  ...
});
```
