
# A ReBars Application

A ReBars application is a collection of components rendered to a DOM element. You can have more than one app on a page if you desire.

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

To start an app, there is minimal code on the page. You create a new ReBars app with an Object containing two keys.

- `$el` the Element that your app will be rendered into
- `root` the top level [component](component.html) in your app.
- `trace` default false, if true will console.log all data changes and re-renders

``` html
<div id="demo-app"></div>

<script type="module">
  import ReBars from "re-bars";
  import RootComponent from "./app.js";

  ReBars.app({
    $el: document.getElementById("demo-app"),
    root: RootComponent,
    trace: true // default false
  });
</script>
```

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
