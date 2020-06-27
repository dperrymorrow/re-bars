## Helpers

If you would like to add helpers to your app you can pass a helpers Object to the `ReBars.app` function.

```javascript
ReBars.app({
  helpers: {} // your custom helpers
  ...
});
```

The helpers operate just as any other Handlebars helper you would add. `this` is the scope of the render block. [more about Handlebars helpers here](https://handlebarsjs.com/guide/#custom-helpers)

In the example below, you would then be able to use your `isChecked` helper anywhere in your application.

{{ example for-docs/custom-helper.js }}

ReBars simply registers these helpers for you to the Handlebars instance of your app. Should you want to register more helpers yourself instead of defining them in your app definition, you can do so using the instance returned from creating your app. It's the same thing.

```javascript
const { instance } = ReBars.app(...);
instance.registerHelper("myCustomHelper", function () {
  // helper code...
})
```
