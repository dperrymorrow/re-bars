## [Getting Started](getting-started)

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

### [Creating an Application](#creating-an-application)

To create an app, invoke the `Rebars.app` function with an Object describing your application. _(We will talk more about thes items in a sec)_.

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

| Key | Type | Description |
| - | - | - |
| instance | Object | the Handlebars instance the app is using |
| render | Function | the function to render the app  |

### [The Render Function](#the-render-function)
You then call `render` passing in the selector for a target element to render to.

```javascript
const app = ReBars.app(...your app definition);
app.render("#my-app");
```
