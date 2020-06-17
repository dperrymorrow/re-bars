
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

You then call `render` passing in the selector of the target element for your application to render to.

```javascript
const app = ReBars.app(...your app definition);
app.render("#my-app");
```

>> example counter

## Global Helpers

If you would like to add helpers to all components within this application you can pass a helpers Object to the `ReBars.app` function, You would then be able to use your `isChecked` helper in any component in your application.

```javascript
ReBars.app({
  $el: document.getElementById("demo-app"),
  root: RootComponent,
  helpers: {
    isChecked: val => (val ? "checked" : ""),
  }
});
```

## Global Components

If you would like to register components for all components within this application you can pass a components Array to the `ReBars.app` function. This is the same as passing your components to a component definition.

```javascript
import MyComponent from "my-component.js";

ReBars.app({
  $el: document.getElementById("demo-app"),
  root: RootComponent,
  components: [ MyComponent ]
});
```

## Handlebars

If you would like use Handlebars from a source other than on `window` _such as loading from a CDN_, you can pass your instance of Handlebars to the `ReBars.app` function.

```javascript
import Handlebars from "somewhere";

ReBars.app({
  Handlebars,
  $el: document.getElementById("demo-app"),
  root: RootComponent,
});
```
