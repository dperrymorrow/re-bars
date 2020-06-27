## Methods

Methods define functions that can be called from event handlers, [see on helper](#the-on-helper) or can be called from another method in your application. This allows you to share code, and prevent redundant declarations.

When a method is triggerd, it is called with the current scope of the template from where it was called `this`, similar to how Handlebars helpers are called with `this` as the scope of which the helper was triggered.

Methods are also called with the first paraeter an object containing the following.

```javascript
methods: {
  myMethod({ event, $app, rootData, $refs, $nextTick, methods}) {
    ...
  }
}
```

| Key | Type | Description |
| - | - | - |
| `event` | `Event Object` | the event Object triggered from the UI interaction MouseEvent ect. |
| `$app` | `Element` | the element that the app is rendered to. |
| `rootData` | `Object` | the data at the root of your application. |
| `$refs` | `Function` | `$refs()` returns all the elements in your application that have been marked with a [ref](#the-ref-helper) |
| `$nextTick` | `Function` | returns a promose when called. Allows you to wait until after the next render to preform an action on the DOM |
| `methods` | `Object` | the methods defined in your app. If called, they will be called with the same scope. |

> If you call a method from another method. The scope remains the same. _(the context in the template where the call originated)_

Here is an example of chaining methods from within a ReBars appliction.

{{ example for-docs/methods.js }}
